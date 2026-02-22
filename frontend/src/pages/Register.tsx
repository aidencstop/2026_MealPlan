import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { register as registerService } from '../services/authService';
import './Auth.css';

// 질병/식이 이슈 옵션
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

// 식단 특성 옵션
const DIET_CHARACTERISTICS = [
  { value: 'vegan', label: '비건' },
  { value: 'vegetarian', label: '베지테리언' },
  { value: 'pescatarian', label: '페스코 베지테리언' },
  { value: 'halal', label: '할랄' },
  { value: 'kosher', label: '코셔' }
];

function Register() {
  // Step 1: 기본 정보
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [age, setAge] = useState('');
  const [dietGoal, setDietGoal] = useState<'weight_gain' | 'weight_loss' | 'maintenance'>('maintenance');
  
  // Step 2: 식단 특성 및 건강 정보
  const [dietCharacteristics, setDietCharacteristics] = useState<string[]>([]);
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  // Step 1 유효성 검사
  const validateStep1 = () => {
    if (!username || !password || !name || !age) {
      setError('모든 필수 항목을 입력해주세요.');
      return false;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return false;
    }
    if (parseInt(age) < 1 || parseInt(age) > 150) {
      setError('올바른 나이를 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleStep1Next = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = {
        username,
        password,
        name,
        gender,
        age: parseInt(age),
        diet_goal: dietGoal,
        diet_characteristics: dietCharacteristics,
        health_conditions: healthConditions.map(condition => ({
          condition_type: condition,
          details: {}
        }))
      };

      const response = await registerService(userData);
      login(response.user);
      navigate('/meal-plan');
    } catch (err: any) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">회원가입</h1>
        <div className="register-steps">
          <span className={step === 1 ? 'active' : ''}>1. 기본 정보</span>
          <span className={step === 2 ? 'active' : ''}>2. 식단 특성 및 건강 정보</span>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleStep1Next} className="auth-form">
            <div className="form-group">
              <label className="form-label">사용자명 *</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호 * (6자 이상)</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? (
                    <svg className="password-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="password-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호 확인 *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  className="form-input"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPasswordConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPasswordConfirm ? (
                    <svg className="password-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="password-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">이름 *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">성별 *</label>
              <select
                className="form-select"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                required
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
              />
            </div>

            <div className="form-group">
              <label className="form-label">식단 목적 *</label>
              <select
                className="form-select"
                value={dietGoal}
                onChange={(e) => setDietGoal(e.target.value as any)}
                required
              >
                <option value="maintenance">현상 유지</option>
                <option value="weight_gain">체중 증가</option>
                <option value="weight_loss">체중 감량</option>
              </select>
            </div>

            <div className="form-submit-step1">
              <button type="submit" className="btn btn-primary">
                다음
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="auth-form">
            <div className="form-group">
              <label className="form-label">식단 특성 (선택)</label>
              <div className="checkbox-group">
                {DIET_CHARACTERISTICS.map(item => (
                  <label key={item.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={dietCharacteristics.includes(item.value)}
                      onChange={() => toggleDietCharacteristic(item.value)}
                      disabled={loading}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">질병 / 알러지 (선택)</label>
              <div className="checkbox-group">
                {HEALTH_CONDITIONS.map(item => (
                  <label key={item.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={healthConditions.includes(item.value)}
                      onChange={() => toggleHealthCondition(item.value)}
                      disabled={loading}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                이전
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '가입 중...' : '가입하기'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
