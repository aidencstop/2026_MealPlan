import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export interface JwtPayload {
  userId: number;
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

  if (!token) {
    res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    return;
  }

  try {
    const payload = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;
    
    req.userId = payload.userId;
    next();
  } catch (error) {
    res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    return;
  }
}
