import { useState, useEffect } from 'react';
import { getCurrentMealPlan, getLastWeekIntake, saveLastWeekIntake, regenerateMealPlan } from '../services/mealPlanService';
import { WeeklyMealPlan, WeeklyIntakeRecord, WeeklyIntake, DailyMeal } from '../types';
import MealEditor from '../components/MealEditor';
import './MealPlan.css';

function MealPlan() {
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [lastWeekRecord, setLastWeekRecord] = useState<WeeklyIntakeRecord | null>(null);
  const [showLastWeekEdit, setShowLastWeekEdit] = useState(false);
  const [lastWeekData, setLastWeekData] = useState<{
    year: number;
    weekStartDate: string;
    weekEndDate: string;
    intakeData: WeeklyIntake;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getCurrentMealPlan();
      setMealPlan(data.mealPlan);
      setLastWeekRecord(data.lastWeekRecord);
    } catch (err: any) {
      setError(err.response?.data?.error || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLastWeek = async () => {
    try {
      const data = await getLastWeekIntake();
      setLastWeekData(data);
      setShowLastWeekEdit(true);
    } catch (err: any) {
      setError(err.response?.data?.error || '지난주 데이터를 불러오는데 실패했습니다.');
    }
  };

  const handleSaveLastWeek = async () => {
    if (!lastWeekData) return;

    try {
      setSaving(true);
      setError('');
      await saveLastWeekIntake({
        year: lastWeekData.year,
        week_start_date: lastWeekData.weekStartDate,
        week_end_date: lastWeekData.weekEndDate,
        intake_data: lastWeekData.intakeData
      });
      setSuccess('지난주 섭취 기록이 저장되었습니다!');
      setShowLastWeekEdit(false);
      // 데이터 다시 로드
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateMealPlan = async () => {
    if (!confirm('현재 식단을 삭제하고 새로운 식단을 생성하시겠습니까?')) {
      return;
    }

    try {
      setRegenerating(true);
      setError('');
      const data = await regenerateMealPlan();
      setMealPlan(data.mealPlan);
      setLastWeekRecord(data.lastWeekRecord);
      setSuccess('새로운 식단이 생성되었습니다!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '식단 재생성에 실패했습니다.');
    } finally {
      setRegenerating(false);
    }
  };

  const updateDayMeal = (day: keyof WeeklyIntake, mealType: keyof DailyMeal, meals: any[]) => {
    if (!lastWeekData) return;
    
    setLastWeekData({
      ...lastWeekData,
      intakeData: {
        ...lastWeekData.intakeData,
        [day]: {
          ...lastWeekData.intakeData[day],
          [mealType]: meals
        }
      }
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

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">주간 식단 추천</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* 1. 지난주 섭취 기록 섹션 */}
      <div className="card">
        <h2 className="card-title">지난주 식단</h2>
        {lastWeekRecord ? (
          <div>
            <p className="info-text">
              {lastWeekRecord.week_start_date} ~ {lastWeekRecord.week_end_date}
            </p>
            <button className="btn btn-secondary" onClick={handleEditLastWeek}>
              수정하기
            </button>
          </div>
        ) : (
          <div>
            <p className="info-text">
              지난주 섭취 기록이 없습니다. 기록을 추가하면 더 정확한 식단 추천을 받을 수 있습니다.
            </p>
            <button className="btn btn-primary" onClick={handleEditLastWeek}>
              지난주 기록 추가
            </button>
          </div>
        )}
      </div>

      {/* 2. 지난주 식단 평가 */}
      {lastWeekRecord && (
        <div className="card">
          <h2 className="card-title">지난주 식단 평가</h2>
          
          <div className="evaluation-section">
            <h3>영양소</h3>
            <div className="macro-info">
              <div className="macro-item">
                <span className="macro-label">칼로리</span>
                <span className="macro-value">{lastWeekRecord.macro.calories?.toLocaleString() || 0} kcal</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">탄수화물</span>
                <span className="macro-value">{lastWeekRecord.macro.carbs_g}g ({lastWeekRecord.macro.ratio.carbs_pct}%)</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">단백질</span>
                <span className="macro-value">{lastWeekRecord.macro.protein_g}g ({lastWeekRecord.macro.ratio.protein_pct}%)</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">지방</span>
                <span className="macro-value">{lastWeekRecord.macro.fat_g}g ({lastWeekRecord.macro.ratio.fat_pct}%)</span>
              </div>
            </div>

            <h3>잘된 점</h3>
            <ul>
              {lastWeekRecord.strengths.map((item, i) => (
                <li key={i} className="positive">{item}</li>
              ))}
            </ul>

            <h3>아쉬운 점</h3>
            <ul>
              {lastWeekRecord.weaknesses.map((item, i) => (
                <li key={i} className="negative">{item}</li>
              ))}
            </ul>

            <h3>개선 방법</h3>
            <ul>
              {lastWeekRecord.improvements.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h3>주의사항</h3>
            <ul>
              {lastWeekRecord.cautions.map((item, i) => (
                <li key={i} className="warning">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 지난주 편집 모달 */}
      {showLastWeekEdit && lastWeekData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>지난주 섭취 기록</h2>
            <p className="modal-subtitle">
              {lastWeekData.weekStartDate} ~ {lastWeekData.weekEndDate}
            </p>
            
            <div className="week-editor">
              {(Object.keys(lastWeekData.intakeData) as Array<keyof WeeklyIntake>).map(day => (
                <div key={day} className="day-section">
                  <h3 className="day-title">{dayNames[day]}</h3>
                  <MealEditor
                    label="아침"
                    meals={lastWeekData.intakeData[day].breakfast}
                    onChange={(meals) => updateDayMeal(day, 'breakfast', meals)}
                  />
                  <MealEditor
                    label="점심"
                    meals={lastWeekData.intakeData[day].lunch}
                    onChange={(meals) => updateDayMeal(day, 'lunch', meals)}
                  />
                  <MealEditor
                    label="저녁"
                    meals={lastWeekData.intakeData[day].dinner}
                    onChange={(meals) => updateDayMeal(day, 'dinner', meals)}
                  />
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowLastWeekEdit(false)}
                disabled={saving}
              >
                취소
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveLastWeek}
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 금주 추천 식단 */}
      {mealPlan && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h2 className="card-title" style={{ marginBottom: '5px' }}>금주 추천 식단</h2>
                <p className="info-text" style={{ marginBottom: 0 }}>
                  {mealPlan.week_start_date} ~ {mealPlan.week_end_date}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleRegenerateMealPlan}
                disabled={regenerating}
              >
                {regenerating ? '생성 중...' : '🔄 다시 추천받기'}
              </button>
            </div>

            <div className="meal-plan-grid">
              {(Object.keys(mealPlan.plan_data) as Array<keyof WeeklyIntake>).map(day => (
                <div key={day} className="day-card">
                  <h3 className="day-title">{dayNames[day]}</h3>
                  <div className="meal-section">
                    <strong>아침:</strong>
                    <ul>
                      {mealPlan.plan_data[day].breakfast.map((item, i) => (
                        <li key={i}>{typeof item === 'string' ? item : item.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="meal-section">
                    <strong>점심:</strong>
                    <ul>
                      {mealPlan.plan_data[day].lunch.map((item, i) => (
                        <li key={i}>{typeof item === 'string' ? item : item.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="meal-section">
                    <strong>저녁:</strong>
                    <ul>
                      {mealPlan.plan_data[day].dinner.map((item, i) => (
                        <li key={i}>{typeof item === 'string' ? item : item.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 금주 주간 영양소 */}
          <div className="card">
            <h2 className="card-title">금주 주간 영양소</h2>
            <div className="macro-info">
              <div className="macro-item">
                <span className="macro-label">칼로리</span>
                <span className="macro-value">{mealPlan.plan_macro.calories?.toLocaleString() || 0} kcal</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">탄수화물</span>
                <span className="macro-value">{mealPlan.plan_macro.carbs_g}g ({mealPlan.plan_macro.ratio.carbs_pct}%)</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">단백질</span>
                <span className="macro-value">{mealPlan.plan_macro.protein_g}g ({mealPlan.plan_macro.ratio.protein_pct}%)</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">지방</span>
                <span className="macro-value">{mealPlan.plan_macro.fat_g}g ({mealPlan.plan_macro.ratio.fat_pct}%)</span>
              </div>
            </div>
          </div>

          {/* 5. 추천 근거 */}
          <div className="card">
            <h2 className="card-title">추천 근거</h2>
            <div className="rationale-section">
              <h3>고려사항</h3>
              <ul>
                {mealPlan.rationale.considered.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <h3>설명</h3>
              <ul>
                {mealPlan.rationale.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 6. 장보기 리스트 */}
          {mealPlan.shopping_list && mealPlan.shopping_list.length > 0 && (
            <div className="card">
              <h2 className="card-title">장보기 리스트</h2>
              <ul className="shopping-list">
                {mealPlan.shopping_list.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MealPlan;
