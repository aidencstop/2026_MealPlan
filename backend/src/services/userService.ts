import pool from '../db/pool.js';
import bcrypt from 'bcrypt';
import { User, HealthCondition, UserProfile } from '../types/index.js';

const SALT_ROUNDS = 10;

/**
 * 사용자 생성 (회원가입)
 */
export async function createUser(userData: {
  username: string;
  password: string;
  name: string;
  gender: string;
  age: number;
  diet_goal: string;
  diet_characteristics: string[];
  health_conditions: Array<{
    condition_type: string;
    details?: any;
  }>;
}): Promise<User> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // 사용자 생성
    const userResult = await client.query(
      `INSERT INTO users 
       (username, password_hash, name, gender, age, diet_goal, diet_characteristics)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, name, gender, age, diet_goal, diet_characteristics, created_at, updated_at`,
      [
        userData.username,
        passwordHash,
        userData.name,
        userData.gender,
        userData.age,
        userData.diet_goal,
        JSON.stringify(userData.diet_characteristics)
      ]
    );

    const user = userResult.rows[0];

    // 질병/알러지 정보 생성
    if (userData.health_conditions && userData.health_conditions.length > 0) {
      for (const condition of userData.health_conditions) {
        await client.query(
          `INSERT INTO health_conditions (user_id, condition_type, details)
           VALUES ($1, $2, $3)`,
          [user.id, condition.condition_type, JSON.stringify(condition.details || {})]
        );
      }
    }

    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 사용자명으로 사용자 찾기
 */
export async function findUserByUsername(username: string): Promise<User | null> {
  const result = await pool.query(
    `SELECT id, username, name, gender, age, diet_goal, diet_characteristics, 
            created_at, updated_at
     FROM users WHERE username = $1`,
    [username]
  );

  return result.rows[0] || null;
}

/**
 * 사용자명과 비밀번호로 인증
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<User | null> {
  const result = await pool.query(
    `SELECT id, username, password_hash, name, gender, age, diet_goal, 
            diet_characteristics, created_at, updated_at
     FROM users WHERE username = $1`,
    [username]
  );

  const user = result.rows[0];
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  // password_hash 제거
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * ID로 사용자 찾기
 */
export async function findUserById(userId: number): Promise<User | null> {
  const result = await pool.query(
    `SELECT id, username, name, gender, age, diet_goal, diet_characteristics, 
            created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * 사용자 프로필 조회 (건강 정보 포함)
 */
export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  const conditionsResult = await pool.query(
    `SELECT id, user_id, condition_type, details, created_at
     FROM health_conditions WHERE user_id = $1`,
    [userId]
  );

  return {
    user,
    health_conditions: conditionsResult.rows
  };
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(
  userId: number,
  updates: {
    name?: string;
    gender?: string;
    age?: number;
    diet_goal?: string;
    diet_characteristics?: string[];
  }
): Promise<User> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.gender !== undefined) {
    fields.push(`gender = $${paramIndex++}`);
    values.push(updates.gender);
  }
  if (updates.age !== undefined) {
    fields.push(`age = $${paramIndex++}`);
    values.push(updates.age);
  }
  if (updates.diet_goal !== undefined) {
    fields.push(`diet_goal = $${paramIndex++}`);
    values.push(updates.diet_goal);
  }
  if (updates.diet_characteristics !== undefined) {
    fields.push(`diet_characteristics = $${paramIndex++}`);
    values.push(JSON.stringify(updates.diet_characteristics));
  }

  values.push(userId);

  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, username, name, gender, age, diet_goal, diet_characteristics, 
               created_at, updated_at`,
    values
  );

  return result.rows[0];
}

/**
 * 건강 상태 업데이트
 */
export async function updateHealthConditions(
  userId: number,
  conditions: Array<{
    condition_type: string;
    details?: any;
  }>
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 기존 건강 정보 삭제
    await client.query('DELETE FROM health_conditions WHERE user_id = $1', [userId]);

    // 새로운 건강 정보 추가
    for (const condition of conditions) {
      await client.query(
        `INSERT INTO health_conditions (user_id, condition_type, details)
         VALUES ($1, $2, $3)`,
        [userId, condition.condition_type, JSON.stringify(condition.details || {})]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
