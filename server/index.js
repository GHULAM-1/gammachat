
const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 5001 });

server.on('connection', (socket) => {
  console.log('hello'); // Log to server
  socket.send('ki haal nay '); // Send to client
});

console.log('WebSocket server running on ws://localhost:5000');