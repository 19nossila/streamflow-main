
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Increase the limit for JSON and URL-encoded bodies
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Database setup - Use a specific path and a direct constructor
const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("[SERVER ERROR] Could not connect to database:", err.message);
  } else {
    console.log("[SERVER] Connected to the SQLite database.");

    // Serialize execution to ensure tables are created in order
    db.serialize(() => {
        // Create tables
        db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT)`, (err) => {
            if(err) console.error("Error creating users table:", err.message);
        });
        db.run(`CREATE TABLE IF NOT EXISTS playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`, (err) => {
            if(err) console.error("Error creating playlists table:", err.message);
        });
        db.run(`CREATE TABLE IF NOT EXISTS playlist_sources (id INTEGER PRIMARY KEY AUTOINCREMENT, playlist_id INTEGER, type TEXT, content TEXT, identifier TEXT, addedAt TEXT, FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE)`, (err) => {
            if(err) console.error("Error creating playlist_sources table:", err.message);
        });

        // Add a default admin user if no users exist
        db.get("SELECT * FROM users LIMIT 1", [], (err, row) => {
            if (err) {
                console.error("[SERVER ERROR] Error checking for users:", err.message);
                return;
            }
            if (!row) {
                console.log("[SERVER] No users found. Creating default admin user (admin/admin).");
                db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', 'admin', 'admin'], function(err) {
                    if (err) {
                        console.error("[SERVER ERROR] Error creating default admin user:", err.message);
                    } else {
                        console.log(`[SERVER] Default admin user created successfully.`);
                    }
                });
            }
        });
    });
  }
});

// --- API Routes ---

// Auth
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (user) {
            res.json(user);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Users
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, role FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { username, password, role } = req.body;
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, role], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, username, role });
  });
});

app.put('/api/users/:userId/password', (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Password updated' });
  });
});

app.delete('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(204).send();
  });
});

// Playlists
app.get('/api/playlists', (req, res) => {
  db.all('SELECT * FROM playlists', [], (err, playlists) => {
    if (err) return res.status(500).json({ error: err.message });
    const promises = playlists.map(p => 
      new Promise((resolve, reject) => {
        db.all('SELECT * FROM playlist_sources WHERE playlist_id = ?', [p.id], (err, sources) => {
          if (err) return reject(err);
          resolve({ ...p, sources: sources || [] });
        });
      })
    );
    Promise.all(promises).then(results => res.json(results)).catch(err => res.status(500).json({ error: err.message }));
  });
});

app.post('/api/playlists', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO playlists (name) VALUES (?)', [name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, sources: [] });
  });
});

app.delete('/api/playlists/:playlistId', (req, res) => {
  const { playlistId } = req.params;
  db.run('DELETE FROM playlists WHERE id = ?', [playlistId], function(err){
      if (err) return res.status(500).json({ error: err.message });
      res.status(204).send();
  });
});

// Sources
app.post('/api/playlists/:playlistId/sources', (req, res) => {
  const { playlistId } = req.params;
  const { type, content, identifier } = req.body;
  const addedAt = new Date().toISOString();
  db.run('INSERT INTO playlist_sources (playlist_id, type, content, identifier, addedAt) VALUES (?, ?, ?, ?, ?)', [playlistId, type, content, identifier, addedAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, playlist_id: parseInt(playlistId), type, content, identifier, addedAt });
  });
});

app.delete('/api/playlists/:playlistId/sources/:sourceId', (req, res) => {
  const { sourceId } = req.params;
  db.run('DELETE FROM playlist_sources WHERE id = ?', [sourceId], function(err){
      if (err) return res.status(500).json({ error: err.message });
      res.status(204).send();
  });
});


app.listen(PORT, () => {
  console.log(`[SERVER] Server is running on http://localhost:${PORT}`);
});
