const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const db = new sqlite3.Database('./chat.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Create a table to store messages
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL
)`);

// Modify the insertMessage function to accept a callback
function insertMessage(nickname, content, timestamp, callback) {
    const sql = `INSERT INTO messages (nickname, content, timestamp) VALUES (?, ?, ?)`;
    db.run(sql, [nickname, content, timestamp], function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null, { id: this.lastID, nickname, content, timestamp });
      }
    });
  }

// Function to retrieve message history
function getMessageHistory(callback) {
  const sql = `SELECT nickname, content, timestamp FROM messages ORDER BY id`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    callback(rows);
  });
}

module.exports = { insertMessage, getMessageHistory };
