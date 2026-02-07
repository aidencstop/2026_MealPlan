import { Request, Response } from 'express';
import { getIntakeHistory, getIntakeRecordById } from '../services/intakeService.js';

/**
 * 섭취 기록 목록 조회 (페이지네이션)
 */
export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 3;

    const result = await getIntakeHistory(req.userId, page, limit);
    
    res.json(result);
  } catch (error: any) {
    console.error('히스토리 조회 에러:', error);
    res.status(500).json({ error: '히스토리 조회 중 오류가 발생했습니다.' });
  }
}

/**
 * 특정 섭취 기록 상세 조회
 */
export async function getRecordDetail(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

  const recordId = req.params.id;
  if (!recordId) {
    res.status(400).json({ error: '올바른 ID를 입력해주세요.' });
    return;
  }

  const record = await getIntakeRecordById(req.userId, recordId);
    if (!record) {
      res.status(404).json({ error: '기록을 찾을 수 없습니다.' });
      return;
    }

    res.json({ record });
  } catch (error: any) {
    console.error('기록 상세 조회 에러:', error);
    res.status(500).json({ error: '기록 상세 조회 중 오류가 발생했습니다.' });
  }
}
