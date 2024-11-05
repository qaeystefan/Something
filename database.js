const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // replace with your MySQL username
  password: 'roottoor', // replace with your MySQL password
  database: 'chat_db' // replace with your MySQL database name
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the MySQL database:', err.message);
    return;
  }
  console.log('Connected to the MySQL database.');
});

// Create a table to store messages
const createMessagesTable = `
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nickname VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

connection.query(createMessagesTable, (err, results, fields) => {
  if (err) {
    console.error('Error creating messages table:', err.message);
    return;
  }
  console.log('Messages table created or already exists.');
});

// Create a table to store topics
const createTopicsTable = `
  CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nickname VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

connection.query(createTopicsTable, (err, results, fields) => {
  if (err) {
    console.error('Error creating topics table:', err.message);
    return;
  }
  console.log('Topics table created or already exists.');
});

// Modify the insertMessage function to accept a callback
function insertMessage(nickname, content, callback) {
  const sql = `INSERT INTO messages (nickname, content) VALUES (?, ?)`;
  connection.query(sql, [nickname, content], (err, results, fields) => {
    if (err) {
      callback(err);
    } else {
      callback(null, { id: results.insertId, nickname, content, timestamp: new Date() });
    }
  });
}

// Function to retrieve message history
function getMessageHistory(callback) {
  const sql = `SELECT nickname, content, timestamp FROM messages ORDER BY id`;
  connection.query(sql, (err, rows, fields) => {
    if (err) {
      return console.error('Error retrieving message history:', err.message);
    }
    callback(rows);
  });
}

// Function to clear the database
function clearDatabase(callback) {
  const sql = `DELETE FROM messages`;
  connection.query(sql, (err, results, fields) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

module.exports = { insertMessage, getMessageHistory, clearDatabase };
