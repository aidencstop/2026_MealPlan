import api from './api';
import { WeeklyMealPlan, WeeklyIntakeRecord, WeeklyIntake } from '../types';

/**
 * 금주 식단 추천 조회
 */
export async function getCurrentMealPlan(): Promise<{
  mealPlan: WeeklyMealPlan;
  lastWeekRecord: WeeklyIntakeRecord | null;
}> {
  const response = await api.get('/meal-plan/current');
  return response.data;
}

/**
 * 지난주 섭취 기록 조회 (편집용)
 */
export async function getLastWeekIntake(): Promise<{
  hasRecord: boolean;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  intakeData: WeeklyIntake;
}> {
  const response = await api.get('/meal-plan/last-week-intake');
  return response.data;
}

/**
 * 지난주 섭취 기록 저장
 */
export async function saveLastWeekIntake(data: {
  year: number;
  week_start_date: string;
  week_end_date: string;
  intake_data: WeeklyIntake;
}): Promise<{ message: string; record: WeeklyIntakeRecord }> {
  const response = await api.post('/meal-plan/save-intake', data);
  return response.data;
}

/**
 * 섭취 기록 히스토리 조회
 */
export async function getIntakeHistory(page: number = 1, limit: number = 3): Promise<{
  records: WeeklyIntakeRecord[];
  total: number;
  hasMore: boolean;
}> {
  const response = await api.get('/intake-history', {
    params: { page, limit }
  });
  return response.data;
}

/**
 * 특정 섭취 기록 상세 조회
 */
export async function getIntakeRecordDetail(id: number): Promise<WeeklyIntakeRecord> {
  const response = await api.get(`/intake-history/${id}`);
  return response.data.record;
}
