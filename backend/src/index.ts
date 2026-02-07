import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './db/firebase.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import mealPlanRoutes from './routes/mealPlan.js';
import intakeHistoryRoutes from './routes/intakeHistory.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '서버가 정상 작동 중입니다.' });
});

// 라우트 등록
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/intake-history', intakeHistoryRoutes);

// 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || '서버 에러가 발생했습니다.'
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '존재하지 않는 경로입니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다.');
  process.exit(0);
});
