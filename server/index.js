
const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 5001 });
let messages = [];
let connectedUsers = new Map(); // Store user metadata by socket

server.on('connection', (socket) => {
  console.log('New connection established'); 
  
  // Send welcome message
  socket.send(JSON.stringify({
    type: 'welcome',
    message: 'ki haal nay'
  }));
  
  // Send current messages
  socket.send(JSON.stringify({
    type: 'messages_update',
    messages: messages
  }));
  
  socket.on('message', (data) => {
    const parsedData = JSON.parse(data);
    
    if (parsedData.type === 'user_register') {
      // Store user metadata
      connectedUsers.set(socket, {
        email: parsedData.email,
        name: parsedData.name,
        avatarUrl: parsedData.avatarUrl
      });
      console.log('User registered:', parsedData.name, parsedData.email);
    }
    
    else if (parsedData.type === 'test-message') {
      console.log('test-message');
      console.log(parsedData.message);
      messages.push(parsedData.message);
      console.log(messages);
      
      // Send updated messages to all connected clients
      server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'messages_update',
            messages: messages
          }));
        }
      });
    }
  });

  // Handle disconnection
  socket.on('close', () => {
    const userInfo = connectedUsers.get(socket);
    if (userInfo) {
      console.log('User disconnected:', userInfo.name);
      connectedUsers.delete(socket);
    }
  });

});

console.log('WebSocket server running on ws://localhost:5001');