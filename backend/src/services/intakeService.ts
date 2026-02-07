import { db } from '../db/firebase.js';
import { WeeklyIntakeRecord, WeeklyIntake, IntakeEvaluation } from '../types/index.js';
import { getUserProfile } from './userService.js';
import { evaluateIntake } from './openaiService.js';

/**
 * 특정 주의 섭취 기록 조회
 */
export async function getIntakeRecord(
  userId: string,
  year: number,
  weekStartDate: string
): Promise<WeeklyIntakeRecord | null> {
  const snapshot = await db
    .collection('weekly_intake_records')
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
    intake_data: data.intake_data,
    macro: data.macro,
    strengths: data.strengths,
    weaknesses: data.weaknesses,
    improvements: data.improvements,
    cautions: data.cautions,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * 섭취 기록 저장 (평가 포함)
 */
export async function saveIntakeRecord(
  userId: string,
  year: number,
  weekStartDate: string,
  weekEndDate: string,
  intakeData: WeeklyIntake
): Promise<WeeklyIntakeRecord> {
  // 사용자 프로필 조회
  const userProfile = await getUserProfile(userId);
  if (!userProfile) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  // AI 평가 생성
  const evaluation = await evaluateIntake(userProfile, intakeData);

  // 기존 기록 확인
  const existingRecord = await getIntakeRecord(userId, year, weekStartDate);

  const recordData = {
    user_id: userId,
    year,
    week_start_date: weekStartDate,
    week_end_date: weekEndDate,
    intake_data: intakeData,
    macro: evaluation.macro,
    strengths: evaluation.strengths,
    weaknesses: evaluation.weaknesses,
    improvements: evaluation.improvements,
    cautions: evaluation.cautions,
    created_at: existingRecord?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (existingRecord) {
    // 업데이트
    await db
      .collection('weekly_intake_records')
      .doc(existingRecord.id)
      .update({
        ...recordData,
        updated_at: new Date().toISOString()
      });

    return {
      id: existingRecord.id,
      ...recordData
    };
  } else {
    // 새로 생성
    const docRef = await db.collection('weekly_intake_records').add(recordData);

    return {
      id: docRef.id,
      ...recordData
    };
  }
}

/**
 * 섭취 기록 목록 조회 (페이지네이션)
 */
export async function getIntakeHistory(
  userId: string,
  page: number = 1,
  limit: number = 3
): Promise<{ records: WeeklyIntakeRecord[]; total: number; hasMore: boolean }> {
  // 전체 개수 조회
  const allSnapshot = await db
    .collection('weekly_intake_records')
    .where('user_id', '==', userId)
    .get();
  const total = allSnapshot.size;

  // 페이지네이션 쿼리
  let query = db
    .collection('weekly_intake_records')
    .where('user_id', '==', userId)
    .orderBy('year', 'desc')
    .orderBy('week_start_date', 'desc')
    .limit(limit);

  // offset 계산 (Firestore는 offset을 직접 지원하지 않으므로 다른 방식 사용)
  const offset = (page - 1) * limit;
  if (offset > 0) {
    const skipSnapshot = await db
      .collection('weekly_intake_records')
      .where('user_id', '==', userId)
      .orderBy('year', 'desc')
      .orderBy('week_start_date', 'desc')
      .limit(offset)
      .get();

    if (!skipSnapshot.empty) {
      const lastDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
      query = query.startAfter(lastDoc);
    }
  }

  const snapshot = await query.get();

  const records: WeeklyIntakeRecord[] = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      user_id: data.user_id,
      year: data.year,
      week_start_date: data.week_start_date,
      week_end_date: data.week_end_date,
      intake_data: data.intake_data,
      macro: data.macro,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      improvements: data.improvements,
      cautions: data.cautions,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  });

  return {
    records,
    total,
    hasMore: offset + records.length < total
  };
}

/**
 * 특정 섭취 기록 상세 조회
 */
export async function getIntakeRecordById(
  userId: string,
  recordId: string
): Promise<WeeklyIntakeRecord | null> {
  const doc = await db.collection('weekly_intake_records').doc(recordId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;

  // 사용자 확인
  if (data.user_id !== userId) {
    return null;
  }

  return {
    id: doc.id,
    user_id: data.user_id,
    year: data.year,
    week_start_date: data.week_start_date,
    week_end_date: data.week_end_date,
    intake_data: data.intake_data,
    macro: data.macro,
    strengths: data.strengths,
    weaknesses: data.weaknesses,
    improvements: data.improvements,
    cautions: data.cautions,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}
