// server.js
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { insertMessage, getMessageHistory, clearDatabase } = require('./database'); // Include the database module

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public')); // Serve static files from the 'public' folder

wss.on('connection', (ws) => {
  // Send the message history to the newly connected client
  getMessageHistory((messages) => {
    ws.send(JSON.stringify({ type: 'history', data: messages }));
  });

  ws.on('message', (message) => {
    // Parse the incoming message
    const messageData = JSON.parse(message);
    console.log('Received message data:', messageData); // Log the received message data
  
    // Insert the new message into the database
    insertMessage(messageData.nickname, messageData.content, new Date().toISOString(), (err, insertedMessage) => {
      if (err) {
          console.error('Error inserting message:', err);
      } else {
          console.log('Inserted message:', insertedMessage);
          // Broadcast incoming message to all clients, including the ID
          const messageToSend = JSON.stringify({ type: 'message', data: insertedMessage });
          wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                  client.send(messageToSend);
              }
          });
      }
    });
  });
});


app.post('/clear-database', (req, res) => {
  clearDatabase((err) => {
    if (err) {
      console.error('Error clearing database:', err);
      res.status(500).send('Error clearing database');
    } else {
      console.log('Database cleared successfully');
      res.status(200).send('Database cleared');
    }
  });
});
server.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});