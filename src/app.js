require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDB } = require('./config/db');
const profileRoutes = require('./routes/profiles');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check / Root ──────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    message: '🚀 GitHub Profile Analyzer API is running!',
    version: '1.0.0',
    endpoints: {
      'POST /api/profiles/analyze':    'Fetch a GitHub user and store insights',
      'GET  /api/profiles':            'List all analyzed profiles',
      'GET  /api/profiles/:username':  'Get a single stored profile',
      'DELETE /api/profiles/:username':'Remove a profile from the database',
    },
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/profiles', profileRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err.message);
    process.exit(1);
  });

module.exports = app;
