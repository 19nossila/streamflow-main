
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("[SERVER ERROR] Could not connect to database:", err.message);
  } else {
    console.log("[SERVER] Connected to the SQLite database.");
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT)`);
      db.run(`CREATE TABLE IF NOT EXISTS player_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)`);
      db.run(`CREATE TABLE IF NOT EXISTS playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`);
      db.run(`CREATE TABLE IF NOT EXISTS playlist_sources (id INTEGER PRIMARY KEY AUTOINCREMENT, playlist_id INTEGER, type TEXT, content TEXT, identifier TEXT, xtream_url TEXT, xtream_user TEXT, xtream_pass TEXT, FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE)`);
      db.run(`CREATE TABLE IF NOT EXISTS user_playlist_access (user_id INTEGER, playlist_id INTEGER, PRIMARY KEY (user_id, playlist_id), FOREIGN KEY(user_id) REFERENCES player_users(id) ON DELETE CASCADE, FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE)`);
      db.get("SELECT * FROM users WHERE role = 'admin' LIMIT 1", (err, row) => {
        if (!row) {
          console.log("[SERVER] No admin found. Creating default admin (admin/admin).");
          db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', 'admin', 'admin']);
        }
      });
    });
  }
});

// --- ADMIN API ROUTES ---
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ? AND role = 'admin'", [username, password], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (user) res.json({ id: user.id, username: user.username, role: user.role });
        else res.status(401).json({ error: 'Invalid admin credentials' });
    });
});
app.get('/api/playlists', (req, res) => {
    db.all('SELECT * FROM playlists', [], (err, playlists) => {
        if (err) return res.status(500).json({ error: err.message });
        const promises = playlists.map(p => new Promise((resolve, reject) => {
            db.all('SELECT id, type, identifier, xtream_url, xtream_user FROM playlist_sources WHERE playlist_id = ?', [p.id], (err, sources) => {
                if (err) return reject(err);
                resolve({ ...p, sources: sources || [] });
            });
        }));
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
  db.run('DELETE FROM playlists WHERE id = ?', [req.params.playlistId], err => { res.status(204).send(); });
});
app.post('/api/playlists/:playlistId/sources', (req, res) => {
  const { playlistId } = req.params;
  const { type, identifier, xtream_url, xtream_user, xtream_pass } = req.body;
  db.run('INSERT INTO playlist_sources (playlist_id, type, identifier, xtream_url, xtream_user, xtream_pass) VALUES (?, ?, ?, ?, ?, ?)', [playlistId, type, identifier, xtream_url, xtream_user, xtream_pass], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});
app.delete('/api/playlists/:playlistId/sources/:sourceId', (req, res) => {
  db.run('DELETE FROM playlist_sources WHERE id = ?', [req.params.sourceId], err => { res.status(204).send(); });
});
app.get('/api/player-users', (req, res) => {
    db.all('SELECT id, username FROM player_users', [], (err, rows) => { res.json(rows); });
});
app.post('/api/player-users', (req, res) => {
    const { username, password } = req.body;
    db.run('INSERT INTO player_users (username, password) VALUES (?, ?)', [username, password], function(err) {
        if (err) return res.status(400).json({ error: 'Username exists.' });
        res.status(201).json({ id: this.lastID, username });
    });
});
app.delete('/api/player-users/:userId', (req, res) => {
    db.run('DELETE FROM player_users WHERE id = ?', [req.params.userId], err => { res.status(204).send(); });
});
app.get('/api/player-users/:userId/playlists', (req, res) => {
    db.all('SELECT playlist_id FROM user_playlist_access WHERE user_id = ?', [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.playlist_id));
    });
});
app.post('/api/player-users/:userId/playlists', (req, res) => {
    db.run('INSERT INTO user_playlist_access (user_id, playlist_id) VALUES (?, ?)', [req.params.userId, req.body.playlist_id], err => { res.status(201).send(); });
});
app.delete('/api/player-users/:userId/playlists/:playlistId', (req, res) => {
    db.run('DELETE FROM user_playlist_access WHERE user_id = ? AND playlist_id = ?', [req.params.userId, req.params.playlistId], err => { res.status(204).send(); });
});


// --- PLAYER API ROUTES ---
app.post('/api/player/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM player_users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (err || !user) return res.status(401).json({ message: 'Invalid credentials' });
        db.all('SELECT p.id, p.name FROM playlists p JOIN user_playlist_access upa ON p.id = upa.playlist_id WHERE upa.user_id = ?', [user.id], (err, playlists) => {
            if (err) return res.status(500).json({ message: 'Error fetching permissions.' });
            res.json({ user_info: { username: user.username, status: 'Active' }, playlists });
        });
    });
});

// --- PROXY MIDDLEWARE ---
const proxyRequest = async (req, res, action) => {
    const { playlistId } = req.params;

    db.get('SELECT xtream_url, xtream_user, xtream_pass FROM playlist_sources WHERE playlist_id = ? AND type = \'xtream\'', [playlistId], async (err, source) => {
        if (err || !source) {
            return res.status(404).send('Playlist source not found or invalid.');
        }

        const { xtream_url, xtream_user, xtream_pass } = source;
        const finalUrl = action === 'stream' 
            ? `${xtream_url}/${req.params.streamType}/${xtream_user}/${xtream_pass}/${req.params.streamId}.${req.params.extension}`
            : `${xtream_url}/player_api.php`;

        try {
            const response = await axios.get(finalUrl, {
                params: action === 'metadata' ? { ...req.query, username: xtream_user, password: xtream_pass } : {},
                responseType: 'stream'
            });
            res.set(response.headers);
            response.data.pipe(res);
        } catch (error) {
            const status = error.response ? error.response.status : 502;
            res.status(status).send(error.message || 'Error connecting to upstream server.');
        }
    });
};

// Proxy for Metadata (get.php actions)
app.get('/api/proxy/playlist/:playlistId/get', (req, res) => {
    // Remap action from query to preserve player_api.php for Xtream
    const queryAction = req.query.action;
    //This is a temporary workaround. We need to find a better way to handle this.
    if(queryAction.includes('series')){
        req.query.action = 'get_series_info';
    }
    proxyRequest(req, res, 'metadata');
});

// Proxy for Streams (live, movie, series)
app.get('/api/proxy/playlist/:playlistId/:streamType/:streamId.:extension', (req, res) => {
    proxyRequest(req, res, 'stream');
});


// --- Server Start ---
app.listen(PORT, () => {
  console.log(`[SERVER] Hybrid Admin/Player server running on http://localhost:${PORT}`);
});
