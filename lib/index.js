function AppeerServer(socket) {
    var clients = {};

    return {
        getCustomIdMiddleware: getCustomIdMiddleware,
        initListeners: initListeners
    };

    function getCustomIdMiddleware(socket, next) {
        var customId = socket.handshake.query.customId,
            id = customId ? customId : socket.id;

        if (clients[id]) {
            console.log('Appeer id is already taken');
            next(new Error('Appeer id is already taken'));
        } else {
            socket.customId = id;
            clients[id] = {
                id: id,
                socket: socket
            };

            next();
        }
    }

    function initListeners(socket) {
        socket.emit('handle-message', {
            type: 'connect',
            id: socket.customId
        });

        socket.on('message', onMessage);
        socket.on('disconnect', onDisconnect);

        function onMessage(message) {
            var remoteId = message.id,
                remoteSocket = clients[remoteId].socket;

            switch (message.type) {
                case 'offer':
                    console.log('Sending offer to:', remoteId);
                    socket.friend = remoteId;

                    socket.to(remoteSocket.id).emit('handle-message', {
                        type: 'offer',
                        offer: message.offer || message.payload,
                        payload: message.payload,
                        id: socket.customId // Send your own id on offer
                    });

                    break;
                case 'answer':
                    console.log('Sending answer to:', remoteId);
                    socket.friend = remoteId;

                    socket.to(remoteSocket.id).emit('handle-message', {
                        type: 'answer',
                        answer: message.answer || message.payload,
                        payload: message.payload
                    });

                    break;
                case 'candidate':
                    console.log('Sending candidate to:', remoteId);

                    socket.to(remoteSocket.id).emit('handle-message', {
                        type: 'candidate',
                        candidate: message.candidate || message.payload,
                        payload: message.payload
                    });

                    break;
                case 'leave':
                    console.log('Disconnecting from', remoteId);

                    socket.to(remoteSocket.id).emit('handle-message', {
                        type: 'leave'
                    });

                    break;
                case 'join':
                    console.log('Joining room', message.room);
                    socket.join(message.room);

                    break;
                default:
                    socket.emit('handle-message', {
                        type: 'error',
                        error: 'Command not found: ' + data.type
                    });
            }
        }

        function onDisconnect() {
            console.log('A user has disconnected with socket id', socket.id);
            if (clients[socket.customId]) {
                clients[socket.customId] = undefined;
            }
        }
    }
}

module.exports = AppeerServer();
