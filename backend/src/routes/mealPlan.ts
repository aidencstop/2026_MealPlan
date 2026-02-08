import express from 'express';
import {
  getCurrentMealPlan,
  getLastWeekIntake,
  saveLastWeekIntake,
  regenerateMealPlan
} from '../controllers/mealPlanController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// 모든 라우트는 인증 필요
router.use(authenticateToken);

// 금주 식단 추천 조회
router.get('/current', getCurrentMealPlan);

// 금주 식단 다시 생성
router.post('/regenerate', regenerateMealPlan);

// 지난주 섭취 기록 조회 (편집용)
router.get('/last-week-intake', getLastWeekIntake);

// 지난주 섭취 기록 저장
router.post('/save-intake', saveLastWeekIntake);

export default router;
