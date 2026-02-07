import { Request, Response } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  updateHealthConditions
} from '../services/userService.js';

/**
 * 사용자 프로필 조회
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const profile = await getUserProfile(req.userId);
    if (!profile) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    res.json(profile);
  } catch (error: any) {
    console.error('프로필 조회 에러:', error);
    res.status(500).json({ error: '프로필 조회 중 오류가 발생했습니다.' });
  }
}

/**
 * 사용자 프로필 수정
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const { name, gender, age, diet_goal, diet_characteristics } = req.body;

    const updatedUser = await updateUserProfile(req.userId, {
      name,
      gender,
      age,
      diet_goal,
      diet_characteristics
    });

    res.json({
      message: '프로필이 수정되었습니다.',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('프로필 수정 에러:', error);
    res.status(500).json({ error: '프로필 수정 중 오류가 발생했습니다.' });
  }
}

/**
 * 건강 정보 조회
 */
export async function getHealthConditions(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const profile = await getUserProfile(req.userId);
    if (!profile) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    res.json({ health_conditions: profile.health_conditions });
  } catch (error: any) {
    console.error('건강 정보 조회 에러:', error);
    res.status(500).json({ error: '건강 정보 조회 중 오류가 발생했습니다.' });
  }
}

/**
 * 건강 정보 수정
 */
export async function updateHealthConditionsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const { health_conditions } = req.body;

    if (!Array.isArray(health_conditions)) {
      res.status(400).json({ error: '건강 정보는 배열이어야 합니다.' });
      return;
    }

    await updateHealthConditions(req.userId, health_conditions);

    res.json({ message: '건강 정보가 수정되었습니다.' });
  } catch (error: any) {
    console.error('건강 정보 수정 에러:', error);
    res.status(500).json({ error: '건강 정보 수정 중 오류가 발생했습니다.' });
  }
}
