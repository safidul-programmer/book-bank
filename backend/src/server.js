import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { db } from '../config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import authRoutes from './routes/authRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.use('/api/health', healthRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/users', userRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

app.use((err, req, res, next) => {
  const status = Number(err.statusCode || err.status) || 500;

  if (status >= 500) {
    console.error(`[server:error] ${err.message}\n${err.stack || ''}`);
  } else {
    console.error(`[server:error] ${req.method} ${req.originalUrl} -> ${status}: ${err.message}`);
  }

  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON request body' });
  }

  if (err.type === 'entity.too.large' || status === 413) {
    return res.status(413).json({ success: false, message: 'Request body too large' });
  }

  if (err.type === 'charset.unsupported' || err.type === 'encoding.unsupported') {
    return res.status(415).json({ success: false, message: 'Unsupported charset or content encoding' });
  }

  const genericMessages = {
    400: 'Bad request',
    403: 'Forbidden',
    404: 'Not found',
    405: 'Method not allowed',
    413: 'Request body too large',
    415: 'Unsupported media type'
  };

  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal server error' : (genericMessages[status] || 'Request failed')
  });
});

async function start() {
  try {
    const connection = await db.getConnection();
    console.log('MySQL connected successfully');
    connection.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await db.end();
        console.log('MySQL pool closed.');
      } catch (err) {
        console.error('Error closing MySQL pool:', err.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
