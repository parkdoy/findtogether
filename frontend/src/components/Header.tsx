import React from 'react';
import './Header.css';
import logo from '/handstogether.svg';
import { type UserProfile } from './LoginForm';

interface HeaderProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onMyPageClick: () => void; // Add new prop
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onLoginClick, onMyPageClick }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <img src={logo} alt="Find Together Logo" className="header-logo" />
        <span className="header-title">Find Together</span>
      </div>
      <nav className="header-nav">
        <a href="#" className="nav-link">서비스 소개</a>
      </nav>
      <div className="header-right">
        {currentUser ? (
          <div className="user-info">
            <button onClick={onMyPageClick} className="mypage-button">
              {currentUser.name || currentUser.email}
            </button>
            <button onClick={onLogout} className="logout-button">로그아웃</button>
          </div>
        ) : (
          <button onClick={onLoginClick} className="login-button">
            로그인
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;