const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors'); // Import the cors middleware
const { insertMessage, getMessageHistory, clearDatabase, insertTopic, updateTopic } = require('./database'); // Include the database module

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let onlineUsers = 0;

function broadcastOnlineUsers() {
  const message = JSON.stringify({ type: 'onlineUsers', data: onlineUsers });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.use(cors()); // Use the cors middleware
app.use(express.static('public')); // Serve static files from the 'public' folder
app.use(express.json()); // Add this line to parse JSON bodies

wss.on('connection', (ws) => {
  onlineUsers++;
  broadcastOnlineUsers();

  // Send the message history to the newly connected client
  getMessageHistory((messages) => {
    ws.send(JSON.stringify({ type: 'history', data: messages }));
  });

  ws.on('message', (message) => {
    // Parse the incoming message
    const messageData = JSON.parse(message);
    console.log('Received message data:', messageData); // Log the received message data
  
    // Insert the new message into the database
    insertMessage(messageData.nickname, messageData.content, (err, insertedMessage) => {
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

  ws.on('close', () => {
    onlineUsers--;
    broadcastOnlineUsers();
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

      // Broadcast a message to all clients to refresh their chat boxes
      const message = JSON.stringify({ type: 'refreshChat' });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });
});


// Endpoint to create a topic
app.post('/create-topic', (req, res) => {
  const { topicTitle, creatorNickname } = req.body;
  insertTopic(topicTitle, creatorNickname, (err, topic) => {
    if (err) {
      console.error('Error creating topic:', err);
      res.status(500).send('Error creating topic');
    } else {
      console.log('Topic created successfully:', topic);
      res.status(201).json(topic);
    }
  });
});

// Endpoint to update a topic
app.put('/update-topic/:id', (req, res) => {
  const { id } = req.params;
  const { topicTitle, creatorNickname } = req.body;
  updateTopic(id, topicTitle, creatorNickname, (err, topic) => {
    if (err) {
      console.error('Error updating topic:', err);
      res.status(500).send(err.message);
    } else {
      console.log('Topic updated successfully:', topic);
      res.status(200).json(topic);
    }
  });
});

server.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});
