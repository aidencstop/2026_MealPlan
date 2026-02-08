import { useState, useEffect, useRef, useCallback } from 'react';
import { getIntakeHistory } from '../services/mealPlanService';
import { WeeklyIntakeRecord, WeeklyIntake } from '../types';
import './IntakeHistory.css';

function IntakeHistory() {
  const [records, setRecords] = useState<WeeklyIntakeRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const data = await getIntakeHistory(page, 3);
      setRecords(prev => [...prev, ...data.records]);
      setHasMore(data.hasMore);
      setPage(prev => prev + 1);
    } catch (err: any) {
      setError(err.response?.data?.error || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMore]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const dayNames: Record<string, string> = {
    sun: '일요일',
    mon: '월요일',
    tue: '화요일',
    wed: '수요일',
    thu: '목요일',
    fri: '금요일',
    sat: '토요일'
  };

  return (
    <div className="page-container">
      <h1 className="page-title">섭취 기록</h1>
      <p className="page-subtitle">주별 식단 섭취 기록을 확인할 수 있습니다.</p>

      {error && <div className="error-message">{error}</div>}

      {records.length === 0 && !loading ? (
        <div className="empty-state">
          <p>아직 저장된 섭취 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="history-list">
          {records.map(record => (
            <div key={record.id} className="history-item">
              <div 
                className="history-header"
                onClick={() => toggleExpand(record.id)}
              >
                <div>
                  <h3>
                    {record.week_start_date} ~ {record.week_end_date}
                  </h3>
                  <p className="history-date">
                    저장일: {new Date(record.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <button className="expand-btn">
                  {expandedIds.has(record.id) ? '▲' : '▼'}
                </button>
              </div>

              {expandedIds.has(record.id) && (
                <div className="history-content">
                  {/* 영양소 */}
                  <div className="section">
                    <h4>주간 영양소</h4>
                    <div className="macro-info">
                      <div className="macro-item">
                        <span className="macro-label">칼로리</span>
                        <span className="macro-value">
                          {record.macro.calories?.toLocaleString() || 0} kcal
                        </span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-label">탄수화물</span>
                        <span className="macro-value">
                          {record.macro.carbs_g}g ({record.macro.ratio.carbs_pct}%)
                        </span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-label">단백질</span>
                        <span className="macro-value">
                          {record.macro.protein_g}g ({record.macro.ratio.protein_pct}%)
                        </span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-label">지방</span>
                        <span className="macro-value">
                          {record.macro.fat_g}g ({record.macro.ratio.fat_pct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 섭취 내역 */}
                  <div className="section">
                    <h4>섭취 내역</h4>
                    <div className="intake-grid">
                      {(Object.keys(record.intake_data) as Array<keyof WeeklyIntake>).map(day => (
                        <div key={day} className="day-intake">
                          <strong>{dayNames[day]}</strong>
                          <div className="meal-list">
                            <div>
                              <span className="meal-time">아침:</span>
                              {record.intake_data[day].breakfast.length > 0
                                ? record.intake_data[day].breakfast.map(m => m.name).join(', ')
                                : '없음'}
                            </div>
                            <div>
                              <span className="meal-time">점심:</span>
                              {record.intake_data[day].lunch.length > 0
                                ? record.intake_data[day].lunch.map(m => m.name).join(', ')
                                : '없음'}
                            </div>
                            <div>
                              <span className="meal-time">저녁:</span>
                              {record.intake_data[day].dinner.length > 0
                                ? record.intake_data[day].dinner.map(m => m.name).join(', ')
                                : '없음'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 평가 */}
                  <div className="section">
                    <h4>잘된 점</h4>
                    <ul className="eval-list positive">
                      {record.strengths.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="section">
                    <h4>아쉬운 점</h4>
                    <ul className="eval-list negative">
                      {record.weaknesses.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="section">
                    <h4>개선 방법</h4>
                    <ul className="eval-list">
                      {record.improvements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="section">
                    <h4>주의사항</h4>
                    <ul className="eval-list warning">
                      {record.cautions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && <div className="loading">로딩 중...</div>}
      
      <div ref={observerTarget} style={{ height: '20px' }} />
    </div>
  );
}

export default IntakeHistory;
