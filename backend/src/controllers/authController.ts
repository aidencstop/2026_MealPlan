import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import {
  createUser,
  authenticateUser,
  findUserByUsername,
  findUserById
} from '../services/userService.js';

// 환경변수 로드
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = '7d';

/**
 * 회원가입
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const {
      username,
      password,
      name,
      gender,
      age,
      diet_goal,
      diet_characteristics,
      health_conditions
    } = req.body;

    // 입력 검증
    if (!username || !password || !name || !gender || !age || !diet_goal) {
      res.status(400).json({ error: '필수 정보를 모두 입력해주세요.' });
      return;
    }

    // 사용자명 중복 확인
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      res.status(409).json({ error: '이미 존재하는 사용자명입니다.' });
      return;
    }

    // 사용자 생성
    const user = await createUser({
      username,
      password,
      name,
      gender,
      age,
      diet_goal,
      diet_characteristics: diet_characteristics || [],
      health_conditions: health_conditions || []
    });

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user
    });
  } catch (error: any) {
    console.error('회원가입 에러:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
}

/**
 * 로그인
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    // 입력 검증
    if (!username || !password) {
      res.status(400).json({ error: '사용자명과 비밀번호를 입력해주세요.' });
      return;
    }

    // 인증
    const user = await authenticateUser(username, password);
    if (!user) {
      res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    // JWT 토큰 생성
    console.log('🔑 JWT 토큰 생성:', { 
      userId: user.id, 
      username: user.username,
      jwtSecret: JWT_SECRET 
    });
    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: '로그인 성공',
      token,
      user
    });
  } catch (error: any) {
    console.error('로그인 에러:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
}

/**
 * 현재 사용자 정보 조회
 */
export async function me(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const user = await findUserById(req.userId);
    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    console.error('사용자 조회 에러:', error);
    res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
  }
}
