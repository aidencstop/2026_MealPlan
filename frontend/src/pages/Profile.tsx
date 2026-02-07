import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, updateHealthConditions } from '../services/userService';
import { UserProfile } from '../types';
import './Profile.css';

const HEALTH_CONDITIONS = [
  { value: 'lactose_intolerance', label: '유당불내증' },
  { value: 'allergy_peanuts', label: '땅콩 알러지' },
  { value: 'allergy_shellfish', label: '갑각류 알러지' },
  { value: 'allergy_eggs', label: '계란 알러지' },
  { value: 'allergy_milk', label: '우유 알러지' },
  { value: 'eating_disorder', label: '식이장애' },
  { value: 'diabetes', label: '당뇨' },
  { value: 'obesity', label: '비만' },
  { value: 'hypertension', label: '고혈압' },
  { value: 'hyperlipidemia', label: '고지혈증' }
];

const DIET_CHARACTERISTICS = [
  { value: 'vegan', label: '비건' },
  { value: 'vegetarian', label: '베지테리언' },
  { value: 'pescatarian', label: '페스코 베지테리언' },
  { value: 'halal', label: '할랄' },
  { value: 'kosher', label: '코셔' }
];

function Profile() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 폼 상태
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState('');
  const [dietGoal, setDietGoal] = useState<'weight_gain' | 'weight_loss' | 'maintenance'>('maintenance');
  const [dietCharacteristics, setDietCharacteristics] = useState<string[]>([]);
  const [healthConditions, setHealthConditions] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      
      // 폼 초기화
      setName(data.user.name);
      setGender(data.user.gender);
      setAge(data.user.age.toString());
      setDietGoal(data.user.diet_goal);
      setDietCharacteristics(data.user.diet_characteristics);
      setHealthConditions(data.health_conditions.map(c => c.condition_type));
    } catch (err: any) {
      setError(err.response?.data?.error || '프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // 기본 정보 업데이트
      await updateUserProfile({
        name,
        gender,
        age: parseInt(age),
        diet_goal: dietGoal,
        diet_characteristics: dietCharacteristics
      });

      // 건강 정보 업데이트
      await updateHealthConditions(
        healthConditions.map(condition => ({
          condition_type: condition,
          details: {}
        }))
      );

      setSuccess('프로필이 성공적으로 수정되었습니다!');
      await refreshUser();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || '프로필 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDietCharacteristic = (value: string) => {
    setDietCharacteristics(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const toggleHealthCondition = (value: string) => {
    setHealthConditions(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!profile) {
    return <div className="error-message">프로필을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">내 정보</h1>
      <p className="page-subtitle">프로필 정보를 수정할 수 있습니다.</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">사용자명</label>
            <input
              type="text"
              className="form-input"
              value={profile.user.username}
              disabled
            />
            <small className="form-help">사용자명은 변경할 수 없습니다.</small>
          </div>

          <div className="form-group">
            <label className="form-label">이름 *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">성별 *</label>
            <select
              className="form-select"
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              required
              disabled={saving}
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">나이 *</label>
            <input
              type="number"
              className="form-input"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="1"
              max="150"
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">식단 목적 *</label>
            <select
              className="form-select"
              value={dietGoal}
              onChange={(e) => setDietGoal(e.target.value as any)}
              required
              disabled={saving}
            >
              <option value="maintenance">현상 유지</option>
              <option value="weight_gain">체중 증가</option>
              <option value="weight_loss">체중 감량</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">식단 특성</label>
            <div className="checkbox-group">
              {DIET_CHARACTERISTICS.map(item => (
                <label key={item.value} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={dietCharacteristics.includes(item.value)}
                    onChange={() => toggleDietCharacteristic(item.value)}
                    disabled={saving}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">질병 / 알러지</label>
            <div className="checkbox-group">
              {HEALTH_CONDITIONS.map(item => (
                <label key={item.value} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={healthConditions.includes(item.value)}
                    onChange={() => toggleHealthCondition(item.value)}
                    disabled={saving}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="card-title">가입 정보</h2>
        <p>가입일: {new Date(profile.user.created_at).toLocaleDateString('ko-KR')}</p>
        <p>마지막 수정: {new Date(profile.user.updated_at).toLocaleDateString('ko-KR')}</p>
      </div>
    </div>
  );
}

export default Profile;
