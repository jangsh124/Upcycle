// src/components/AccountMenu.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AccountMenu.css";

export default function AccountMenu({ userEmail, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleProfile      = () => { navigate("/mypage");                 setOpen(false); };
  const handleMyProducts   = () => { navigate("/mypage/products");        setOpen(false); };
  const handleSettings     = () => { alert("Settings 기능은 준비 중입니다."); setOpen(false); };

  return (
    <div className="account-menu-container">
      <button className="account-button" onClick={() => setOpen(v => !v)}>
        My Page
      </button>
      {open && (
        <div className="dropdown-menu">
          <div className="dropdown-email">{userEmail}</div>

          <div className="dropdown-item" onClick={handleProfile}>
            <span role="img" aria-label="profile">🙂</span> Profile
          </div>

          {/* ─── 여기에 내 상품 전체보기 메뉴 추가 ─── */}
          <div className="dropdown-item" onClick={handleMyProducts}>
            <span role="img" aria-label="my-products">📦</span> My Products
          </div>

          <div className="dropdown-item" onClick={handleSettings}>
            <span role="img" aria-label="settings">⚙️</span> Settings
          </div>

          <div className="dropdown-item logout" onClick={onLogout}>
            <span role="img" aria-label="logout">🚪</span> Log Out
          </div>
        </div>
      )}
    </div>
  );
}
