import React from "react";
import { Link } from "react-router-dom";
import AccountMenu from "./AccountMenu";
import "./NavBar.css";

export default function NavBar({ userEmail, onLogout }) {
  return (
    <div className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">UpcycleFuture</Link>
      </div>
      <div className="navbar-right">
        {userEmail ? (
          <>
          
            <AccountMenu userEmail={userEmail} onLogout={onLogout} />
          </>
        ) : (
          <Link to="/login" className="login-link">로그인</Link>
        )}
      </div>
    </div>
  );
}
