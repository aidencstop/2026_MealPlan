import { db } from '../db/firebase.js';
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
  // 비밀번호 해시
  const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

  // 사용자 데이터 준비
  const userDoc = {
    username: userData.username,
    password_hash: passwordHash,
    name: userData.name,
    gender: userData.gender,
    age: userData.age,
    diet_goal: userData.diet_goal,
    diet_characteristics: userData.diet_characteristics,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Firestore에 저장
  const userRef = await db.collection('users').add(userDoc);
  const userId = userRef.id;

  // 건강 정보 저장 (서브컬렉션)
  if (userData.health_conditions && userData.health_conditions.length > 0) {
    const batch = db.batch();
    userData.health_conditions.forEach(condition => {
      const conditionRef = db
        .collection('users')
        .doc(userId)
        .collection('health_conditions')
        .doc();
      batch.set(conditionRef, {
        condition_type: condition.condition_type,
        details: condition.details || {},
        created_at: new Date().toISOString()
      });
    });
    await batch.commit();
  }

  // 반환할 사용자 객체
  return {
    id: userId,
    username: userDoc.username,
    name: userDoc.name,
    gender: userDoc.gender as any,
    age: userDoc.age,
    diet_goal: userDoc.diet_goal as any,
    diet_characteristics: userDoc.diet_characteristics,
    created_at: userDoc.created_at,
    updated_at: userDoc.updated_at
  };
}

/**
 * 사용자명으로 사용자 찾기
 */
export async function findUserByUsername(username: string): Promise<User | null> {
  const snapshot = await db
    .collection('users')
    .where('username', '==', username)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    username: data.username,
    name: data.name,
    gender: data.gender,
    age: data.age,
    diet_goal: data.diet_goal,
    diet_characteristics: data.diet_characteristics,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * 사용자명과 비밀번호로 인증
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<User | null> {
  const snapshot = await db
    .collection('users')
    .where('username', '==', username)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  const isValid = await bcrypt.compare(password, data.password_hash);
  if (!isValid) {
    return null;
  }

  return {
    id: doc.id,
    username: data.username,
    name: data.name,
    gender: data.gender,
    age: data.age,
    diet_goal: data.diet_goal,
    diet_characteristics: data.diet_characteristics,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * ID로 사용자 찾기
 */
export async function findUserById(userId: string): Promise<User | null> {
  const doc = await db.collection('users').doc(userId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    username: data.username,
    name: data.name,
    gender: data.gender,
    age: data.age,
    diet_goal: data.diet_goal,
    diet_characteristics: data.diet_characteristics,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * 사용자 프로필 조회 (건강 정보 포함)
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  // 건강 정보 조회
  const conditionsSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('health_conditions')
    .get();

  const health_conditions: HealthCondition[] = conditionsSnapshot.docs.map(doc => ({
    id: doc.id,
    user_id: userId,
    condition_type: doc.data().condition_type,
    details: doc.data().details,
    created_at: doc.data().created_at
  }));

  return {
    user,
    health_conditions
  };
}

/**
 * 사용자 프로필 업데이트
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    gender?: string;
    age?: number;
    diet_goal?: string;
    diet_characteristics?: string[];
  }
): Promise<User> {
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  await db.collection('users').doc(userId).update(updateData);

  const user = await findUserById(userId);
  return user!;
}

/**
 * 건강 상태 업데이트
 */
export async function updateHealthConditions(
  userId: string,
  conditions: Array<{
    condition_type: string;
    details?: any;
  }>
): Promise<void> {
  // 기존 건강 정보 삭제
  const existingConditions = await db
    .collection('users')
    .doc(userId)
    .collection('health_conditions')
    .get();

  const batch = db.batch();
  existingConditions.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 새로운 건강 정보 추가
  conditions.forEach(condition => {
    const conditionRef = db
      .collection('users')
      .doc(userId)
      .collection('health_conditions')
      .doc();
    batch.set(conditionRef, {
      condition_type: condition.condition_type,
      details: condition.details || {},
      created_at: new Date().toISOString()
    });
  });

  await batch.commit();
}
