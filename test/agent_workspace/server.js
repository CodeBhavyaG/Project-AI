const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE user (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, profile_picture TEXT NOT NULL)`);
  db.run(`CREATE TABLE image (id TEXT PRIMARY KEY, url TEXT NOT NULL, description TEXT NOT NULL, uploaded_by TEXT REFERENCES user(id))`);
  db.run(`CREATE TABLE tag (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL)`);
  db.run(`CREATE TABLE category (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL)`);
  db.run(`CREATE TABLE board (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, created_by TEXT REFERENCES user(id))`);
  db.run(`CREATE TABLE pin (id TEXT PRIMARY KEY, image_id TEXT REFERENCES image(id), board_id TEXT REFERENCES board(id), description TEXT NOT NULL)`);
  db.run(`CREATE TABLE follow (id TEXT PRIMARY KEY, user_id TEXT REFERENCES user(id), followed_user_id TEXT REFERENCES user(id))`);
  db.run(`CREATE TABLE notification (id TEXT PRIMARY KEY, user_id TEXT REFERENCES user(id), message TEXT NOT NULL)`);

  const uid = uuidv4();
  db.run(`INSERT INTO user VALUES (?, 'test@test.com', 'testuser', 'pass123', 'default.png')`, [uid]);
  const iid = uuidv4();
  db.run(`INSERT INTO image VALUES (?, 'https://picsum.photos/200', 'A sample image', ?)`, [iid, uid]);
  const bid = uuidv4();
  db.run(`INSERT INTO board VALUES (?, 'My Board', ?)`, [bid, uid]);
  db.run(`INSERT INTO pin VALUES (?, ?, ?, 'A pinned image')`, [uuidv4(), iid, bid]);
});

app.post('/users', (req, res) => {
  const id = uuidv4();
  const { email, username, password, profile_picture } = req.body;
  db.run(`INSERT INTO user VALUES (?, ?, ?, ?, ?)`, [id, email, username, password, profile_picture || 'default.png'], (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id, email, username });
  });
});

app.get('/images/search', (req, res) => {
  db.all(`SELECT * FROM image`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/boards/pins', (req, res) => {
  db.all(`SELECT pin.*, image.url FROM pin JOIN image ON pin.image_id = image.id`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
