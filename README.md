# AppeerJS Server
A simple signaling server built for appeerjs clients using Socket.io.

## Getting Started
1. Go to your project directory using your command line tool then install the project using npm.
 
  ```shell
  npm install appeerjs-server
  ```
2. Require appeer.js to your main server script.

  ```javascript
  var AppeerServer = require('appeerjs-server').AppeerServer;
  ```
3. Setup the Socket.io and then instantiate the AppeerServer inside the connection event.
   Let's say the file name is server.js.

  ```javascript
  // Create an https server instance to listen to request
  var server = require('https').createServer(sslConf, app);
  var io = require('socket.io').listen(server);
  
  io.on('connection', function (socket) {
    var appeer = new AppeerServer(socket);
  });
  ```
4. Run the server, and you're good to go.
  
  ```shell
  node server.js
  ```
  
## Inspirations and Motivations 
- [PeerJS] (http://peerjs.com/)

## Credits
- [Socket.io] (http://socket.io/)

## License
This project is licensed under the MIT License - see the [LICENSE] (https://github.com/TMJPEngineering/appeerjs-server/blob/master/LICENSE) file for details

## TODO
- [ ] Unit tests
