
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Create tables and default admin user
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS playlist_sources (id INTEGER PRIMARY KEY AUTOINCREMENT, playlist_id INTEGER, type TEXT, content TEXT, identifier TEXT, addedAt TEXT, FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE)`);

  // Add a default admin user if no users exist
  db.get("SELECT * FROM users", (err, row) => {
    if (err) {
        console.error("Error checking for users:", err.message);
        return;
    }
    if (!row) {
        console.log("No users found. Creating default admin user.");
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', 'admin', 'admin'], function(err) {
            if (err) {
                console.error("Error creating default admin user:", err.message);
            } else {
                console.log(`Default admin user created. ID: ${this.lastID}`);
            }
        });
    }
  });
});


// API Routes
// --- Auth ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (user) {
            // In a real app, you'd generate a session token (e.g., JWT)
            // For this app, we just return the user object
            res.json(user);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});


// --- User Management ---
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, role FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
  }
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, role], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, username, role });
  });
});

app.put('/api/users/:userId/password', (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
  }
  db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: 'Password updated successfully' });
  });
});

app.delete('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
    }
    res.status(204).send(); // No content
  });
});


// --- Playlist (Collection) Management ---
app.get('/api/playlists', (req, res) => {
  db.all('SELECT * FROM playlists', [], (err, playlists) => {
    if (err) return res.status(500).json({ error: err.message });

    const promises = playlists.map(p => 
      new Promise((resolve, reject) => {
        db.all('SELECT * FROM playlist_sources WHERE playlist_id = ?', [p.id], (err, sources) => {
          if (err) return reject(err);
          // Ensure sources is always an array
          resolve({ ...p, sources: sources || [] });
        });
      })
    );

    Promise.all(promises)
      .then(results => res.json(results))
      .catch(err => res.status(500).json({ error: err.message }));
  });
});

app.post('/api/playlists', (req, res) => {
  const { name } = req.body;
   if (!name) {
      return res.status(400).json({ error: "Playlist name is required" });
  }
  db.run('INSERT INTO playlists (name) VALUES (?)', [name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, sources: [] });
  });
});

app.delete('/api/playlists/:playlistId', (req, res) => {
  const { playlistId } = req.params;
  // Using ON DELETE CASCADE now, so we only need to delete the playlist
  db.run('DELETE FROM playlists WHERE id = ?', [playlistId], function(err){
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Playlist not found" });
      res.status(204).send();
  });
});


// --- Source Management ---
app.post('/api/playlists/:playlistId/sources', (req, res) => {
  const { playlistId } = req.params;
  const { type, content, identifier } = req.body;

  if (!type || !content || !identifier) {
      return res.status(400).json({ error: "Missing source fields" });
  }

  const addedAt = new Date().toISOString();
  db.run(
    'INSERT INTO playlist_sources (playlist_id, type, content, identifier, addedAt) VALUES (?, ?, ?, ?, ?)',
    [playlistId, type, content, identifier, addedAt], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, playlist_id: parseInt(playlistId), type, content, identifier, addedAt });
    }
  );
});

app.delete('/api/playlists/:playlistId/sources/:sourceId', (req, res) => {
  const { sourceId } = req.params;
  db.run('DELETE FROM playlist_sources WHERE id = ?', [sourceId], function(err){
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Source not found" });
      res.status(204).send();
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
