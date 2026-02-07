import express from 'express';
import { getHistory, getRecordDetail } from '../controllers/intakeHistoryController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// 모든 라우트는 인증 필요
router.use(authenticateToken);

// 섭취 기록 목록 조회 (페이지네이션)
router.get('/', getHistory);

// 특정 기록 상세 조회
router.get('/:id', getRecordDetail);

export default router;
