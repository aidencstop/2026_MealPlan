import express from 'express';
import { register, login, me } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// 회원가입
router.post('/register', register);

// 로그인
router.post('/login', login);

// 현재 사용자 정보 (인증 필요)
router.get('/me', authenticateToken, me);

export default router;
