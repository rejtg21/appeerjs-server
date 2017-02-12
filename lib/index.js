function AppeerServer() {
    var clients = {}, // Holds the sockets of the connected clients
        rooms = {}; // Holds the existing rooms and its members

    var debug = false; // Option to show console logs or not

    return {
        getCustomIdMiddleware: getCustomIdMiddleware,
        initListeners: initListeners
    };

    function getCustomIdMiddleware(socket, next) {
        var customId = socket.handshake.query.customId,
            id = customId ? customId : socket.id;

        if (clients[id]) {
            _log('Appeer id is already taken');
            next(new Error('Appeer id is already taken'));
        } else {
            // Join the customId provided so that we can emit events to this id
            if (customId) socket.join(customId);

            // Assign a appeerId property to socket object for ease of access
            socket.appeerId = id;
            clients[id] = {
                socket: socket,
                rooms: {}
            };

            next();
        }
    }

    function initListeners(io, socket, options) {
        options = options || {};
        debug = options.debug || false; // Set the debugging option

        _log('A client has connected with Appeer Id', socket.appeerId);
        socket.send({
            type: 'connect',
            appeerId: socket.appeerId
        });

        socket.on('message', onMessage);
        socket.on('disconnect', onDisconnect);

        function onMessage(message, cb) {
            var from = socket.appeerId, // Either custom id or socket id
                to = message.to, // Either appeer id or room id
                payload = message.payload,
                type = message.type;

            switch (type) {
                case 'offer':
                case 'answer':
                case 'candidate':
                    _log('Sending', type, 'to:', to, 'from:', from);

                    socket.to(to).send({
                        type: type,
                        payload: payload,
                        id: from
                    });

                    break;
                case 'call':
                    _log('Initiating call to room:', to, 'by:', from);
                    // Add this client to the members of the room
                    rooms[to].members.push(from);
                    var type = 'incoming-call';

                    if(rooms[to].members.length > 1)
                        type = 'joined-call';

                    socket.broadcast.to(to).send({
                        // type: 'incoming-call',
                        // inform others that you joined
                        type: type,
                        id: from,
                        room: to
                    });

                    // var members = rooms[to].members;

                    // socket.send({
                    //     type: 'call-participants',
                    //     members: members
                    // });

                    // // add now the members
                    // members.push(from);

                    break;
                case 'answer-call':
                    var members = rooms[to].members,
                        membersLen = members.length;

                    _log('Answering call from room:', to, 'by:', from);

                    // Call all currently existing members of the room
                    for (var i = 0; i < membersLen; i++) {
                        var member = members[i];
                        _log('Starting call to:', member);

                        socket.to(member).send({
                            type: 'incoming-member',
                            id: from,
                            room: to
                        });
                    }

                    // Add this client to the members of the room
                    members.push(from);

                    break;
                case 'join':
                    var room = message.room;
                    
                    _log('Joining room', room);

                    if (! rooms[room]) {
                        rooms[room] = { members: [] };
                    }

                    socket.join(room);
                    clients[from].rooms[room] = room.toString();
                    cb(room);

                    break;
                case 'close':
                    var room = message.room;
                    _log('Disconnecting to:', room || to, 'from:', from);

                    if (room) {
                        socket.leave(room);
                        removeMemberFromRoom(from, room);
                    } else {
                        broadcastCloseEvent(from, to);
                    }

                    break;
                default:
                    socket.send({
                        type: 'error',
                        error: 'Command not found: ' + type
                    });
            }
        }

        function onDisconnect() {
            var id = socket.appeerId,
                clientRooms = clients[id].rooms;

            _log('A client has disconnected with Appeer Id', id);
            
            // Remove the client to all joined rooms
            for (var room in clientRooms) {
                removeMemberFromRoom(id, room);
            }

            if (clients[id]) {
                delete clients[id];
            }
        }

        // Private functions

        function removeMemberFromRoom(member, room) {
            if (! rooms[room]) return;

            var members = rooms[room].members,
                index = members.indexOf(member);

            if (index > -1) {
                members.splice(index, 1); // Remove the client from members
                broadcastCloseEvent(member, room); // Inform the existing members
            }

            // Remove the room if it has no members anymore
            if (members.length === 0) delete rooms[room];
        }

        function broadcastCloseEvent(from, to) {
            socket.to(to).send({
                type: 'close',
                id: from
            });
        }

        function _log() {
            if (debug) {
                console.log.apply(console, arguments);
            }
        }
    }
}

module.exports = AppeerServer();