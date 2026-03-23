require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/db');

const authRoutes = require('./routes/auth');
const benchmarkRoutes = require('./routes/benchmarks');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');
const hardwareRoutes = require('./routes/hardware');
const ratingsRoutes = require('./routes/ratings');
const votesRoutes = require('./routes/votes');
const profilesRoutes = require('./routes/profiles');
const feedRoutes = require('./routes/feed');
const collectionsRoutes = require('./routes/collections');
const tagsRoutes = require('./routes/tags');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function startServer() {
  await initializeDatabase();
  console.log('Database initialized');

  app.use('/api/auth', authRoutes);
  app.use('/api/benchmarks', benchmarkRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/hardware', hardwareRoutes);
  app.use('/api/ratings', ratingsRoutes);
  app.use('/api/votes', votesRoutes);
  app.use('/api/profiles', profilesRoutes);
  app.use('/api/feed', feedRoutes);
  app.use('/api/collections', collectionsRoutes);
  app.use('/api/tags', tagsRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

module.exports = app;
