import express from 'express';
import {
  getProfile,
  updateProfile,
  getHealthConditions,
  updateHealthConditionsHandler
} from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// 모든 라우트는 인증 필요
router.use(authenticateToken);

// 프로필 조회 및 수정
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// 건강 정보 조회 및 수정
router.get('/health-conditions', getHealthConditions);
router.put('/health-conditions', updateHealthConditionsHandler);

export default router;
