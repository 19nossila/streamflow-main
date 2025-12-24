
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, param, validationResult } from 'express-validator';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_super_seguro_aqui';

// --- Segurança de Cabeçalhos (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "*"], // Permite carregar logos de canais de qualquer lugar
      "connect-src": ["'self'", "*"],      // Permite conectar a APIs de IPTV externas
      "media-src": ["'self'", "*", "blob:"], // Permite streams de vídeo de qualquer lugar
    },
  },
}));

// --- Rate Limiting (Proteção contra Brute Force e DoS) ---
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP por janela
  message: { error: 'Muitas requisições vindas deste IP, tente novamente mais tarde.' }
});

const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Apenas 10 tentativas de login por hora por IP
  message: { error: 'Muitas tentativas de login. Sua conta pode estar sob ataque ou você esqueceu a senha. Tente novamente em uma hora.' }
});

app.use('/api/', generalLimiter);
app.use('/api/login', loginLimiter);

// --- Configuração CORS ---
const allowedOrigins = [
  'http://localhost:3000', // Para desenvolvimento do frontend
  'http://localhost:5173', // Outra porta comum do Vite durante o desenvolvimento
  // Adicione aqui outros domínios de produção, ex: 'https://seuapp.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem 'origin' (ex: mobile apps, curl, ou same-origin)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Se você usar cookies ou headers de autorização
}));

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Helper para validar resultados do express-validator
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ errors: errors.array() });
};

// Database setup
const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("[SERVER ERROR] Could not connect to database:", err.message);
  } else {
    console.log("[SERVER] Connected to the SQLite database.");
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS playlist_sources (id INTEGER PRIMARY KEY AUTOINCREMENT, playlist_id INTEGER, type TEXT, content TEXT, identifier TEXT, addedAt TEXT, FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE)`);
        db.run(`CREATE TABLE IF NOT EXISTS epg_channels (id TEXT PRIMARY KEY, displayName TEXT, icon TEXT)`);
        db.run(`CREATE TABLE IF NOT EXISTS epg_programs (channelId TEXT, title TEXT, description TEXT, startTime TEXT, endTime TEXT, PRIMARY KEY (channelId, startTime))`);

        db.get("SELECT * FROM users LIMIT 1", [], async (err, row) => {
            if (!row) {
                console.log("[SERVER] No users found. Creating default admin user.");
                const hashedPassword = await bcrypt.hash('admin', 10);
                db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin']);
            }
        });
    });
  }
});

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });
  next();
};

// --- API Routes ---

// Auth
app.post('/api/login', [
  body('username').isString().trim().notEmpty().escape(),
  body('password').isString().notEmpty(),
  validate
], (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Credenciais inválidas' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, token });
    });
});

// Users
app.get('/api/users', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT id, username, role FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', [
  authenticateToken, 
  isAdmin,
  body('username').isString().trim().isLength({ min: 3 }).escape(),
  body('password').isString().isLength({ min: 5 }),
  body('role').isIn(['admin', 'user']),
  validate
], async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, username, role });
  });
});

app.put('/api/users/:userId/password', [
  authenticateToken,
  param('userId').isInt(),
  body('newPassword').isString().isLength({ min: 5 }),
  validate
], async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') return res.status(403).json({ error: 'Não autorizado' });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Senha atualizada com sucesso' });
  });
});

app.delete('/api/users/:userId', [
  authenticateToken, 
  isAdmin,
  param('userId').isInt(),
  validate
], (req, res) => {
  const { userId } = req.params;
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(204).send();
  });
});

// Playlists
app.get('/api/playlists', authenticateToken, (req, res) => {
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

app.post('/api/playlists', [
  authenticateToken, 
  isAdmin,
  body('name').isString().trim().notEmpty().escape(),
  validate
], (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO playlists (name) VALUES (?)', [name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, sources: [] });
  });
});

app.delete('/api/playlists/:playlistId', [
  authenticateToken, 
  isAdmin,
  param('playlistId').isInt(),
  validate
], (req, res) => {
  const { playlistId } = req.params;
  db.run('DELETE FROM playlists WHERE id = ?', [playlistId], function(err){
      if (err) return res.status(500).json({ error: err.message });
      res.status(204).send();
  });
});

// Sources
app.post('/api/playlists/:playlistId/sources', [
  authenticateToken, 
  isAdmin,
  param('playlistId').isInt(),
  body('type').isIn(['m3u', 'xtream']),
  body('content').isString().notEmpty(),
  body('identifier').isString().trim().notEmpty().escape(),
  validate
], (req, res) => {
  const { playlistId } = req.params;
  const { type, content, identifier } = req.body;
  const addedAt = new Date().toISOString();
  db.run('INSERT INTO playlist_sources (playlist_id, type, content, identifier, addedAt) VALUES (?, ?, ?, ?, ?)', [playlistId, type, content, identifier, addedAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, playlist_id: parseInt(playlistId), type, content, identifier, addedAt });
  });
});

app.delete('/api/playlists/:playlistId/sources/:sourceId', [
  authenticateToken, 
  isAdmin,
  param('playlistId').isInt(),
  param('sourceId').isInt(),
  validate
], (req, res) => {
  const { sourceId } = req.params;
  db.run('DELETE FROM playlist_sources WHERE id = ?', [sourceId], function(err){
      if (err) return res.status(500).json({ error: err.message });
      res.status(204).send();
  });
});

// EPG Routes
app.post('/api/epg', [
  authenticateToken, 
  isAdmin,
  body('channels').isArray(),
  body('programs').isArray(),
  validate
], (req, res) => {
    const { channels, programs } = req.body;
    db.serialize(() => {
        db.run('DELETE FROM epg_channels');
        db.run('DELETE FROM epg_programs');
        const channelStmt = db.prepare('INSERT INTO epg_channels (id, displayName, icon) VALUES (?, ?, ?)');
        for (const channel of channels) {
            channelStmt.run(channel.id, channel.displayName, channel.icon);
        }
        channelStmt.finalize();
        const programStmt = db.prepare('INSERT INTO epg_programs (channelId, title, description, startTime, endTime) VALUES (?, ?, ?, ?, ?)');
        for (const program of programs) {
            programStmt.run(program.channelId, program.title, program.description, program.startTime, program.endTime);
        }
        programStmt.finalize();
        res.status(201).json({ message: 'EPG data imported successfully' });
    });
});

app.get('/api/epg/channels/:channelId/programs', [
  authenticateToken,
  param('channelId').isString().notEmpty(),
  validate
], (req, res) => {
    const { channelId } = req.params;
    db.all('SELECT * FROM epg_programs WHERE channelId = ? ORDER BY startTime', [channelId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({...r, startTime: new Date(r.startTime), endTime: new Date(r.endTime)})));
    });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[SERVER] Server is running on port ${PORT}`);
});
