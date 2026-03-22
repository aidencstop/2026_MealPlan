import dotenv from 'dotenv';

// Load env vars first
dotenv.config();

import express from 'express';
import cors from 'cors';
import './db/firebase.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import mealPlanRoutes from './routes/mealPlan.js';
import intakeHistoryRoutes from './routes/intakeHistory.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running.' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/intake-history', intakeHistoryRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An error occurred on the server.'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다.');
  process.exit(0);
});
