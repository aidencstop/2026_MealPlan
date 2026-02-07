import { db } from '../db/firebase.js';
import { WeeklyMealPlan, WeeklyIntake } from '../types/index.js';
import { getUserProfile } from './userService.js';
import { getIntakeRecord } from './intakeService.js';
import { generateMealPlan } from './openaiService.js';
import { getCurrentWeekBounds, getLastWeekBounds } from '../utils/weekUtils.js';

/**
 * 특정 주의 식단 조회
 */
export async function getMealPlan(
  userId: string,
  year: number,
  weekStartDate: string
): Promise<WeeklyMealPlan | null> {
  const snapshot = await db
    .collection('weekly_meal_plans')
    .where('user_id', '==', userId)
    .where('year', '==', year)
    .where('week_start_date', '==', weekStartDate)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    user_id: data.user_id,
    year: data.year,
    week_start_date: data.week_start_date,
    week_end_date: data.week_end_date,
    plan_data: data.plan_data,
    plan_macro: data.plan_macro,
    rationale: data.rationale,
    shopping_list: data.shopping_list,
    substitutions: data.substitutions,
    created_at: data.created_at
  };
}

/**
 * 금주 식단 생성 또는 조회
 */
export async function getCurrentWeekMealPlan(userId: string): Promise<WeeklyMealPlan> {
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

  // Firestore에 저장
  const planDoc = {
    user_id: userId,
    year,
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    plan_data: mealPlanData.plan,
    plan_macro: mealPlanData.plan_macro,
    rationale: mealPlanData.rationale,
    shopping_list: mealPlanData.shopping_list,
    substitutions: mealPlanData.substitutions,
    created_at: new Date().toISOString()
  };

  const docRef = await db.collection('weekly_meal_plans').add(planDoc);

  return {
    id: docRef.id,
    ...planDoc
  };
}

/**
 * 지난주 섭취 기록 조회 (편집용)
 * - 저장된 기록이 있으면 반환
 * - 없으면 빈 템플릿 반환
 */
export async function getLastWeekIntakeForEdit(userId: string): Promise<{
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
