import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export interface JwtPayload {
  userId: string;
  username: string;
}

/**
 * JWT 토큰 검증 미들웨어
 */
export function authenticateToken(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 인증 체크:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    jwtSecret: process.env.JWT_SECRET ? '설정됨' : '미설정'
  });

  if (!token) {
    console.log('❌ 토큰 없음');
    res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    return;
  }

  try {
    const payload = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;
    
    console.log('✅ 토큰 검증 성공:', { userId: payload.userId });
    req.userId = payload.userId;
    next();
  } catch (error: any) {
    console.log('❌ 토큰 검증 실패:', error.message);
    res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    return;
  }
}
