import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          주간 식단 추천
        </Link>

        <div className="navbar-right" ref={menuRef}>
          <button
            type="button"
            className="navbar-hamburger"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="메뉴"
            aria-expanded={menuOpen}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>

          {menuOpen && (
            <div className="navbar-dropdown">
              {user ? (
                <>
                  <span className="navbar-dropdown-user">{user.name}님</span>
                  <Link to="/meal-plan" className="navbar-dropdown-link" onClick={closeMenu}>
                    식단 추천
                  </Link>
                  <Link to="/intake-history" className="navbar-dropdown-link" onClick={closeMenu}>
                    섭취 기록
                  </Link>
                  <Link to="/profile" className="navbar-dropdown-link" onClick={closeMenu}>
                    내 정보
                  </Link>
                  <button onClick={handleLogout} className="navbar-dropdown-link navbar-dropdown-btn">
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="navbar-dropdown-link" onClick={closeMenu}>
                    로그인
                  </Link>
                  <Link to="/register" className="navbar-dropdown-link" onClick={closeMenu}>
                    회원가입
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
