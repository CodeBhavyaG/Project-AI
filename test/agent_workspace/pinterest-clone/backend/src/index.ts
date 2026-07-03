import express, { Request, Response } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Initialize SQLite Database
const db = new Database('pinterest.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    profile_picture TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS image (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS board (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    user_id TEXT NOT NULL,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS pin (
    id TEXT PRIMARY KEY,
    image_id TEXT NOT NULL,
    board_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES image(id),
    FOREIGN KEY (board_id) REFERENCES board(id)
  );

  CREATE TABLE IF NOT EXISTS tag (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS category (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS follow (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES user(id),
    FOREIGN KEY (following_id) REFERENCES user(id),
    UNIQUE(follower_id, following_id)
  );
`);

// ==================== USER ENDPOINTS ====================

// Create user
app.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO user (id, email, username, password)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, email, username, hashedPassword);

    res.status(201).json({ id, email, username, message: 'User created successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get user profile
app.get('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const userStmt = db.prepare('SELECT id, email, username, profile_picture, bio, created_at FROM user WHERE id = ?');
    const user = userStmt.get(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get followers count
    const followersStmt = db.prepare('SELECT COUNT(*) as count FROM follow WHERE following_id = ?');
    const followersCount = (followersStmt.get(id) as any).count;

    // Get following count
    const followingStmt = db.prepare('SELECT COUNT(*) as count FROM follow WHERE follower_id = ?');
    const followingCount = (followingStmt.get(id) as any).count;

    // Get pins count
    const pinsStmt = db.prepare('SELECT COUNT(*) as count FROM pin WHERE board_id IN (SELECT id FROM board WHERE user_id = ?)');
    const pinsCount = (pinsStmt.get(id) as any).count;

    // Get boards count
    const boardsStmt = db.prepare('SELECT COUNT(*) as count FROM board WHERE user_id = ?');
    const boardsCount = (boardsStmt.get(id) as any).count;

    res.json({
      ...user,
      followersCount,
      followingCount,
      pinsCount,
      boardsCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
app.post('/users/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const stmt = db.prepare('SELECT * FROM user WHERE email = ?');
    const user = stmt.get(email) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      profile_picture: user.profile_picture
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.patch('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, bio, profile_picture } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (bio) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (profile_picture) {
      updates.push('profile_picture = ?');
      values.push(profile_picture);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE user SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    res.json({ message: 'User updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== IMAGE ENDPOINTS ====================

// Upload image
app.post('/images', upload.single('image'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const id = uuidv4();
    const fileName = req.file.filename;
    const fileType = req.file.mimetype;
    const filePath = req.file.path;

    const stmt = db.prepare(`
      INSERT INTO image (id, file_name, file_type, file_path)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, fileName, fileType, filePath);

    res.status(201).json({
      id,
      file_name: fileName,
      file_type: fileType,
      file_path: `/uploads/${fileName}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get image
app.get('/images/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM image WHERE id = ?');
    const image = stmt.get(id);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json(image);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all images
app.get('/images', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM image ORDER BY created_at DESC');
    const images = stmt.all();

    res.json(images);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete image
app.delete('/images/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get image file path
    const imageStmt = db.prepare('SELECT file_path FROM image WHERE id = ?');
    const image = imageStmt.get(id) as any;

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(image.file_path)) {
      fs.unlinkSync(image.file_path);
    }

    // Delete from database
    const stmt = db.prepare('DELETE FROM image WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BOARD ENDPOINTS ====================

// Create board
app.post('/boards', (req: Request, res: Response) => {
  try {
    const { title, description, user_id, cover_image } = req.body;
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO board (id, title, description, user_id, cover_image)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, title, description, user_id, cover_image);

    res.status(201).json({ id, title, description, user_id, cover_image, message: 'Board created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all boards for a user
app.get('/users/:userId/boards', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stmt = db.prepare('SELECT * FROM board WHERE user_id = ? ORDER BY created_at DESC');
    const boards = stmt.all(userId);

    res.json(boards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get board
app.get('/boards/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM board WHERE id = ?');
    const board = stmt.get(id);

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Get pins for this board
    const pinsStmt = db.prepare(`
      SELECT p.*, i.file_path, i.file_name
      FROM pin p
      JOIN image i ON p.image_id = i.id
      WHERE p.board_id = ?
      ORDER BY p.created_at DESC
    `);
    const pins = pinsStmt.all(id);

    res.json({ ...board, pins });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update board
app.patch('/boards/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, cover_image } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description) {
      updates.push('description = ?');
      values.push(description);
    }
    if (cover_image) {
      updates.push('cover_image = ?');
      values.push(cover_image);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE board SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    res.json({ message: 'Board updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete board
app.delete('/boards/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete pins first
    const deletePinsStmt = db.prepare('DELETE FROM pin WHERE board_id = ?');
    deletePinsStmt.run(id);

    // Delete board
    const stmt = db.prepare('DELETE FROM board WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'Board deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PIN ENDPOINTS ====================

// Create pin
app.post('/pins', (req: Request, res: Response) => {
  try {
    const { image_id, board_id, title, description, tags } = req.body;
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO pin (id, image_id, board_id, title, description, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, image_id, board_id, title, description, JSON.stringify(tags || []));

    res.status(201).json({ id, image_id, board_id, title, description, tags, message: 'Pin created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pins
app.get('/pins', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT p.*, i.file_path, i.file_name, b.title as board_title
      FROM pin p
      JOIN image i ON p.image_id = i.id
      JOIN board b ON p.board_id = b.id
      ORDER BY p.created_at DESC
    `);
    const pins = stmt.all();

    res.json(pins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get pin
app.get('/pins/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`
      SELECT p.*, i.file_path, i.file_name, b.title as board_title
      FROM pin p
      JOIN image i ON p.image_id = i.id
      JOIN board b ON p.board_id = b.id
      WHERE p.id = ?
    `);
    const pin = stmt.get(id);

    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    res.json(pin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete pin
app.delete('/pins/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM pin WHERE id = ?');
    stmt.run(id);

    res.json({ message: 'Pin deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update pin
app.patch('/pins/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, tags, board_id } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description) {
      updates.push('description = ?');
      values.push(description);
    }
    if (tags) {
      updates.push('tags = ?');
      values.push(JSON.stringify(tags));
    }
    if (board_id) {
      updates.push('board_id = ?');
      values.push(board_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE pin SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    res.json({ message: 'Pin updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TAG ENDPOINTS ====================

// Create tag
app.post('/tags', (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const id = uuidv4();

    const stmt = db.prepare('INSERT INTO tag (id, name) VALUES (?, ?)');
    stmt.run(id, name);

    res.status(201).json({ id, name, message: 'Tag created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tags
app.get('/tags', (req: Request, res: Response) => {
  try {
    const stmt = db.prepare('SELECT * FROM tag ORDER BY name');
    const tags = stmt.all();

    res.json(tags);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FOLLOW ENDPOINTS ====================

// Follow user
app.post('/follow', (req: Request, res: Response) => {
  try {
    const { follower_id, following_id } = req.body;
    const id = uuidv4();

    const stmt = db.prepare('INSERT INTO follow (id, follower_id, following_id) VALUES (?, ?, ?)');
    stmt.run(id, follower_id, following_id);

    res.status(201).json({ message: 'Followed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unfollow user
app.delete('/follow', (req: Request, res: Response) => {
  try {
    const { follower_id, following_id } = req.query;

    const stmt = db.prepare('DELETE FROM follow WHERE follower_id = ? AND following_id = ?');
    stmt.run(follower_id, following_id);

    res.json({ message: 'Unfollowed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get followers
app.get('/users/:id/followers', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.profile_picture
      FROM follow f
      JOIN user u ON f.follower_id = u.id
      WHERE f.following_id = ?
    `);
    const followers = stmt.all(id);

    res.json(followers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get following
app.get('/users/:id/following', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.profile_picture
      FROM follow f
      JOIN user u ON f.following_id = u.id
      WHERE f.follower_id = ?
    `);
    const following = stmt.all(id);

    res.json(following);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SEARCH & FILTER ENDPOINTS ====================

// Search pins
app.get('/search/pins', (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const stmt = db.prepare(`
      SELECT p.*, i.file_path, i.file_name, b.title as board_title
      FROM pin p
      JOIN image i ON p.image_id = i.id
      JOIN board b ON p.board_id = b.id
      WHERE p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?
      ORDER BY p.created_at DESC
    `);

    const searchTerm = `%${q}%`;
    const pins = stmt.all(searchTerm, searchTerm, searchTerm);

    res.json(pins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Filter pins by tag
app.get('/filter/pins', (req: Request, res: Response) => {
  try {
    const { tag } = req.query;

    if (!tag) {
      return res.status(400).json({ error: 'Tag required' });
    }

    const stmt = db.prepare(`
      SELECT p.*, i.file_path, i.file_name, b.title as board_title
      FROM pin p
      JOIN image i ON p.image_id = i.id
      JOIN board b ON p.board_id = b.id
      WHERE p.tags LIKE ?
      ORDER BY p.created_at DESC
    `);

    const pins = stmt.all(`%"${tag}"%`);

    res.json(pins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pins with filters
app.get('/feed', (req: Request, res: Response) => {
  try {
    const { tag, board_id, user_id } = req.query;

    let query = `
      SELECT p.*, i.file_path, i.file_name, b.title as board_title, b.user_id as board_user_id
      FROM pin p
      JOIN image i ON p.image_id = i.id
      JOIN board b ON p.board_id = b.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (tag) {
      query += ' AND p.tags LIKE ?';
      params.push(`%"${tag}"%`);
    }

    if (board_id) {
      query += ' AND p.board_id = ?';
      params.push(board_id);
    }

    if (user_id) {
      query += ' AND b.user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY p.created_at DESC';

    const stmt = db.prepare(query);
    const pins = stmt.all(...params);

    res.json(pins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Pinterest Clone API running on http://localhost:${PORT}`);
});