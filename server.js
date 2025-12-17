
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Modern replacement for body-parser

// Rate Limiter for the login endpoint to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, 
  message: 'Too many login attempts, please try again after 15 minutes',
});


// --- API Routes ---

// 1. LOGIN ENDPOINT
// Validates user credentials against the Xtream Codes API.
app.post('/api/login', loginLimiter, async (req, res) => {
  const { xtreamUrl, username, password } = req.body;

  if (!xtreamUrl || !username || !password) {
    return res.status(400).json({ message: 'Server URL, Username, and Password are required.' });
  }

  try {
    const fullXtreamUrl = `${xtreamUrl}/player_api.php`;
    const response = await axios.post(fullXtreamUrl, new URLSearchParams({ username, password }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data.user_info && response.data.user_info.auth === 1) {
      // Authentication successful
      // We also replace the server url in the response to point to our proxy
      const proxyUrl = `${req.protocol}://${req.get('host')}`;
      response.data.server_info.url = proxyUrl;
      response.data.server_info.port = "";
      response.data.server_info.https_port = "";
      res.json(response.data);
    } else {
      // Authentication failed
      res.status(401).json({ message: 'Invalid credentials or server error.' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(502).json({ message: 'Could not connect to the IPTV server.' });
  }
});


// --- PROXY ROUTES ---
// These routes forward requests to the Xtream server, adding credentials from headers.

const proxyMiddleware = async (req, res, next) => {
    req.xtream = {
        url: req.headers['x-xtream-url'],
        user: req.headers['x-xtream-user'],
        pass: req.headers['x-xtream-pass'],
    };

    if (!req.xtream.url || !req.xtream.user || !req.xtream.pass) {
        return res.status(401).send('Missing Xtream credentials in request headers.');
    }
    next();
};

// 2. PROXY FOR METADATA (get.php)
app.get('/get.php', proxyMiddleware, async (req, res) => {
    const { url, user, pass } = req.xtream;
    try {
        const response = await axios({
            method: 'get',
            url: `${url}/get.php`,
            params: { ...req.query, username: user, password: pass },
            responseType: 'stream'
        });
        res.set(response.headers);
        response.data.pipe(res);
    } catch (error) {
        console.error('Get.php proxy error:', error.message);
        res.status(502).send('Error fetching data from upstream server.');
    }
});

// 3. PROXY FOR STREAMS (Live, Movie, Series)
const streamProxyHandler = async (req, res) => {
    const { url, user, pass } = req.xtream;
    const { type, streamId, extension } = req.params;
    
    // Ensure type is one of the allowed values
    if (!['live', 'movie', 'series'].includes(type)) {
        return res.status(400).send('Invalid stream type.');
    }

    const fullStreamUrl = `${url}/${type}/${user}/${pass}/${streamId}.${extension}`;

    try {
        const response = await axios({
            method: 'get',
            url: fullStreamUrl,
            responseType: 'stream',
        });
        res.set(response.headers);
        response.data.pipe(res);
    } catch (error) { 
        // Don't log 'not found' errors which happen often with streams
        if (error.response?.status !== 404) {
            console.error('Stream proxy error:', error.message);
        }
        res.status(error.response?.status || 502).send('Error fetching stream from upstream server.');
    }
};

app.get('/:type/:streamId.:extension', proxyMiddleware, streamProxyHandler);


// --- Server Start ---
app.listen(PORT, () => {
  console.log(`[SERVER] Simplified proxy server is running on http://localhost:${PORT}`);
});
