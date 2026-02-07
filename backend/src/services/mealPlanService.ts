import pool from '../db/pool.js';
import { WeeklyMealPlan, WeeklyIntake } from '../types/index.js';
import { getUserProfile } from './userService.js';
import { getIntakeRecord } from './intakeService.js';
import { generateMealPlan } from './openaiService.js';
import { getCurrentWeekBounds, getLastWeekBounds } from '../utils/weekUtils.js';

/**
 * 특정 주의 식단 조회
 */
export async function getMealPlan(
  userId: number,
  year: number,
  weekStartDate: string
): Promise<WeeklyMealPlan | null> {
  const result = await pool.query(
    `SELECT * FROM weekly_meal_plans
     WHERE user_id = $1 AND year = $2 AND week_start_date = $3`,
    [userId, year, weekStartDate]
  );

  return result.rows[0] || null;
}

/**
 * 금주 식단 생성 또는 조회
 */
export async function getCurrentWeekMealPlan(userId: number): Promise<WeeklyMealPlan> {
  const currentWeek = getCurrentWeekBounds();
  const { year, weekStartDate, weekEndDate } = currentWeek;

  // 이미 생성된 식단이 있는지 확인
  let existingPlan = await getMealPlan(userId, year, weekStartDate);
  if (existingPlan) {
    return existingPlan;
  }

  // 사용자 프로필 조회
  const userProfile = await getUserProfile(userId);
  if (!userProfile) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  // 지난주 섭취 기록 조회
  const lastWeek = getLastWeekBounds();
  const lastWeekRecord = await getIntakeRecord(userId, lastWeek.year, lastWeek.weekStartDate);

  // AI로 식단 생성
  const mealPlanData = await generateMealPlan(
    userProfile,
    weekStartDate,
    weekEndDate,
    lastWeekRecord ? {
      macro: lastWeekRecord.macro,
      strengths: lastWeekRecord.strengths,
      weaknesses: lastWeekRecord.weaknesses,
      improvements: lastWeekRecord.improvements,
      cautions: lastWeekRecord.cautions
    } : undefined,
    lastWeekRecord?.intake_data
  );

  // DB에 저장
  const result = await pool.query(
    `INSERT INTO weekly_meal_plans
     (user_id, year, week_start_date, week_end_date, plan_data, plan_macro, 
      rationale, shopping_list, substitutions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      userId,
      year,
      weekStartDate,
      weekEndDate,
      JSON.stringify(mealPlanData.plan),
      JSON.stringify(mealPlanData.plan_macro),
      JSON.stringify(mealPlanData.rationale),
      JSON.stringify(mealPlanData.shopping_list),
      JSON.stringify(mealPlanData.substitutions)
    ]
  );

  return result.rows[0];
}

/**
 * 지난주 섭취 기록 조회 (편집용)
 * - 저장된 기록이 있으면 반환
 * - 없으면 빈 템플릿 반환
 */
export async function getLastWeekIntakeForEdit(userId: number): Promise<{
  hasRecord: boolean;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  intakeData: WeeklyIntake;
}> {
  const lastWeek = getLastWeekBounds();
  const record = await getIntakeRecord(userId, lastWeek.year, lastWeek.weekStartDate);

  if (record) {
    return {
      hasRecord: true,
      year: record.year,
      weekStartDate: record.week_start_date,
      weekEndDate: record.week_end_date,
      intakeData: record.intake_data
    };
  }

  // 빈 템플릿 반환
  const emptyDay = {
    breakfast: [],
    lunch: [],
    dinner: []
  };

  return {
    hasRecord: false,
    year: lastWeek.year,
    weekStartDate: lastWeek.weekStartDate,
    weekEndDate: lastWeek.weekEndDate,
    intakeData: {
      sun: { ...emptyDay },
      mon: { ...emptyDay },
      tue: { ...emptyDay },
      wed: { ...emptyDay },
      thu: { ...emptyDay },
      fri: { ...emptyDay },
      sat: { ...emptyDay }
    }
  };
}
