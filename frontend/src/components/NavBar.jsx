import React from "react";
import { Link, useLocation } from "react-router-dom";
import AccountMenu from "./AccountMenu";
import "./NavBar.css";

export default function NavBar({ userEmail, onLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="mobile-navbar">
      <div className="nav-tabs">
        <Link to="/" className={`nav-tab ${isActive('/') ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9,22 9,12 15,12 15,22"></polyline>
          </svg>
          <span>홈</span>
        </Link>
        
        <Link to="/products" className={`nav-tab ${isActive('/products') ? 'active' : ''}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21,15 16,10 5,21"></polyline>
          </svg>
          <span>갤러리</span>
        </Link>
        
        {userEmail && (
          <Link to="/product-form" className={`nav-tab ${isActive('/product-form') ? 'active' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>등록</span>
          </Link>
        )}
        
        {userEmail ? (
          <Link to="/mypage" className={`nav-tab ${isActive('/mypage') ? 'active' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>프로필</span>
          </Link>
        ) : (
          <Link to="/login" className={`nav-tab ${isActive('/login') ? 'active' : ''}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10,17 15,12 10,7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span>로그인</span>
          </Link>
        )}
      </div>
    </div>
  );
}
