import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          주간 식단 추천
        </Link>
        
        {user ? (
          <div className="navbar-menu">
            <Link to="/meal-plan" className="navbar-link">
              식단 추천
            </Link>
            <Link to="/intake-history" className="navbar-link">
              섭취 기록
            </Link>
            <Link to="/profile" className="navbar-link">
              내 정보
            </Link>
            <span className="navbar-user">{user.name}님</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              로그아웃
            </button>
          </div>
        ) : (
          <div className="navbar-menu">
            <Link to="/login" className="navbar-link">
              로그인
            </Link>
            <Link to="/register" className="navbar-link">
              회원가입
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
