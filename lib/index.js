function AppeerServer(socket) {
    this.socket = socket;

    // Execute all mandatory listeners
    this.initListeners(socket);
}

AppeerServer.prototype.initListeners = function (socket) {
    socket.emit('handle-message', {
        type: 'connect',
        id: socket.id
    });

    socket.on('message', onMessage);

    function onMessage(message) {
        var remoteId = message.id;

        switch (message.type) {
            case 'offer':
                console.log('Sending offer to:', remoteId);
                socket.friend = remoteId;

                socket.to(remoteId).emit('handle-message', {
                    type: 'offer',
                    offer: message.offer,
                    id: socket.id // Send your own id on offer
                });
                break;
            case 'answer':
                console.log('Sending answer to:', remoteId);
                socket.friend = remoteId;

                socket.to(remoteId).emit('handle-message', {
                    type: 'answer',
                    answer: message.answer
                });
                break;
            case 'candidate':
                console.log('Sending candidate to:', remoteId);

                socket.to(remoteId).emit('handle-message', {
                    type: 'candidate',
                    candidate: message.candidate
                });
                break;
            case 'leave':
                console.log('Disconnecting from', remoteId);

                socket.to(remoteId).emit('handle-message', {
                    type: 'leave'
                });
                break;
            default:
                socket.emit('handle-message', {
                    type: 'error',
                    error: 'Command not found: ' + data.type
                });
        }
    }
};

module.exports.AppeerServer = AppeerServer;
