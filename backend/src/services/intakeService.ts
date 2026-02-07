import pool from '../db/pool.js';
import { WeeklyIntakeRecord, WeeklyIntake, IntakeEvaluation } from '../types/index.js';
import { getUserProfile } from './userService.js';
import { evaluateIntake } from './openaiService.js';

/**
 * 특정 주의 섭취 기록 조회
 */
export async function getIntakeRecord(
  userId: number,
  year: number,
  weekStartDate: string
): Promise<WeeklyIntakeRecord | null> {
  const result = await pool.query(
    `SELECT * FROM weekly_intake_records
     WHERE user_id = $1 AND year = $2 AND week_start_date = $3`,
    [userId, year, weekStartDate]
  );

  return result.rows[0] || null;
}

/**
 * 섭취 기록 저장 (평가 포함)
 */
export async function saveIntakeRecord(
  userId: number,
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

  // DB에 저장
  const result = await pool.query(
    `INSERT INTO weekly_intake_records 
     (user_id, year, week_start_date, week_end_date, intake_data, macro, 
      strengths, weaknesses, improvements, cautions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id, year, week_start_date) 
     DO UPDATE SET
       intake_data = EXCLUDED.intake_data,
       macro = EXCLUDED.macro,
       strengths = EXCLUDED.strengths,
       weaknesses = EXCLUDED.weaknesses,
       improvements = EXCLUDED.improvements,
       cautions = EXCLUDED.cautions,
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      year,
      weekStartDate,
      weekEndDate,
      JSON.stringify(intakeData),
      JSON.stringify(evaluation.macro),
      JSON.stringify(evaluation.strengths),
      JSON.stringify(evaluation.weaknesses),
      JSON.stringify(evaluation.improvements),
      JSON.stringify(evaluation.cautions)
    ]
  );

  return result.rows[0];
}

/**
 * 섭취 기록 목록 조회 (페이지네이션)
 */
export async function getIntakeHistory(
  userId: number,
  page: number = 1,
  limit: number = 3
): Promise<{ records: WeeklyIntakeRecord[]; total: number; hasMore: boolean }> {
  const offset = (page - 1) * limit;

  // 총 개수 조회
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM weekly_intake_records WHERE user_id = $1`,
    [userId]
  );
  const total = parseInt(countResult.rows[0].count);

  // 데이터 조회
  const result = await pool.query(
    `SELECT * FROM weekly_intake_records
     WHERE user_id = $1
     ORDER BY year DESC, week_start_date DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return {
    records: result.rows,
    total,
    hasMore: offset + result.rows.length < total
  };
}

/**
 * 특정 섭취 기록 상세 조회
 */
export async function getIntakeRecordById(
  userId: number,
  recordId: number
): Promise<WeeklyIntakeRecord | null> {
  const result = await pool.query(
    `SELECT * FROM weekly_intake_records
     WHERE id = $1 AND user_id = $2`,
    [recordId, userId]
  );

  return result.rows[0] || null;
}
