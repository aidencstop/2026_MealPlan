import api from './api';
import { UserProfile, User, HealthCondition } from '../types';

/**
 * 사용자 프로필 조회
 */
export async function getUserProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/users/profile');
  return response.data;
}

/**
 * 사용자 프로필 수정
 */
export async function updateUserProfile(data: {
  name?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  diet_goal?: 'weight_gain' | 'weight_loss' | 'maintenance';
  diet_characteristics?: string[];
}): Promise<{ message: string; user: User }> {
  const response = await api.put('/users/profile', data);
  return response.data;
}

/**
 * 건강 정보 조회
 */
export async function getHealthConditions(): Promise<HealthCondition[]> {
  const response = await api.get('/users/health-conditions');
  return response.data.health_conditions;
}

/**
 * 건강 정보 수정
 */
export async function updateHealthConditions(conditions: Array<{
  condition_type: string;
  details?: any;
}>): Promise<{ message: string }> {
  const response = await api.put('/users/health-conditions', {
    health_conditions: conditions
  });
  return response.data;
}
