import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dumpsRouter from './routes/dumps.js';
import settingsRouter from './routes/settings.js';
import safetyRouter from './routes/safety.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api', dumpsRouter);
app.use('/api', settingsRouter);
app.use('/api', safetyRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express global error handler:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`USAII Cognitive Load Triage API Server Running`);
  console.log(`Listening on Port: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
