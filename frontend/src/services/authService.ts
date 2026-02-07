import api from './api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

/**
 * 로그인
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  
  // 토큰 저장
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  
  return response.data;
}

/**
 * 회원가입
 */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', userData);
  
  // 토큰 저장
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  
  return response.data;
}

/**
 * 로그아웃
 */
export function logout(): void {
  localStorage.removeItem('token');
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<{ user: User }>('/auth/me');
  return response.data.user;
}

/**
 * 토큰 확인
 */
export function hasToken(): boolean {
  return !!localStorage.getItem('token');
}
