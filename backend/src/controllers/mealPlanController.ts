import { Request, Response } from 'express';
import {
  getCurrentWeekMealPlan,
  getLastWeekIntakeForEdit
} from '../services/mealPlanService.js';
import { saveIntakeRecord, getIntakeRecord } from '../services/intakeService.js';
import { getLastWeekBounds } from '../utils/weekUtils.js';

/**
 * 금주 식단 추천 조회
 */
export async function getCurrentMealPlan(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const mealPlan = await getCurrentWeekMealPlan(req.userId);
    
    // 지난주 섭취 기록도 함께 조회
    const lastWeek = getLastWeekBounds();
    const lastWeekRecord = await getIntakeRecord(
      req.userId,
      lastWeek.year,
      lastWeek.weekStartDate
    );

    res.json({
      mealPlan,
      lastWeekRecord: lastWeekRecord || null
    });
  } catch (error: any) {
    console.error('식단 조회 에러:', error);
    res.status(500).json({ error: error.message || '식단 조회 중 오류가 발생했습니다.' });
  }
}

/**
 * 지난주 섭취 기록 조회 (편집용)
 */
export async function getLastWeekIntake(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const intakeData = await getLastWeekIntakeForEdit(req.userId);
    res.json(intakeData);
  } catch (error: any) {
    console.error('지난주 기록 조회 에러:', error);
    res.status(500).json({ error: '지난주 기록 조회 중 오류가 발생했습니다.' });
  }
}

/**
 * 지난주 섭취 기록 저장
 */
export async function saveLastWeekIntake(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const { year, week_start_date, week_end_date, intake_data } = req.body;

    if (!year || !week_start_date || !week_end_date || !intake_data) {
      res.status(400).json({ error: '필수 정보를 모두 입력해주세요.' });
      return;
    }

    const record = await saveIntakeRecord(
      req.userId,
      year,
      week_start_date,
      week_end_date,
      intake_data
    );

    res.json({
      message: '섭취 기록이 저장되었습니다.',
      record
    });
  } catch (error: any) {
    console.error('섭취 기록 저장 에러:', error);
    res.status(500).json({ error: error.message || '섭취 기록 저장 중 오류가 발생했습니다.' });
  }
}
