import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import SignupModal from "../components/Modal";
import "./Signup.css";

export default function Signup({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [modal, setModal] = useState({ open: false, message: "" });
  const [showPw, setShowPw] = useState(false);

  // 입력값 유효성 체크
  const isEmailValid = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/.test(email);
  const isPwValid = pw.length >= 8;
  const isFormValid = isEmailValid && isPwValid;

  const handleSignup = async (e) => {
    e.preventDefault();
    // 비밀번호 정책 체크
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^+=-])[A-Za-z\d@$!%*#?&^+=-]{8,}$/;
    if (!passwordRegex.test(pw)) {
      setModal({
        open: true,
        message: "비밀번호는 최소 8자이상, 영문, 숫자, 특수문자를 모두 포함해야 합니다.",
      });
      return;
    }
    try {
      const res = await axios.post("http://localhost:5001/api/auth/signup", {
        email,
        password: pw,
      });
      setMsg("회원가입 성공: " + res.data.user.email);
      setModal({ open: true, message: "회원가입 성공!" });
    } catch (err) {
      setMsg("에러: " + (err.response?.data?.error || "회원가입 실패"));
      setModal({
        open: true,
        message: "회원가입 실패: " + (err.response?.data?.error || ""),
      });
    }
  };

  return (
    <div className="signup-container">
      <h2>회원가입</h2>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br />
        <div className="pw-row">
          <input
            type={showPw ? "text" : "password"}
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="pw-input"
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPw((v) => !v)}
            tabIndex={-1}
            aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {showPw ? "🙈" : "👁️"}
          </button>
        </div>
        <div className="password-policy">
          비밀번호는 <b>최소 8자이상</b>, <span style={{color: "#d00"}}>영문</span>, <span style={{color: "#007bff"}}>숫자</span>, <span style={{color: "#28a745"}}>특수문자</span>를 모두 포함해야 합니다.
        </div>
        <button
          type="submit"
          className={`signup-btn ${isFormValid ? 'active' : 'inactive'}`}
          disabled={!isFormValid}
        >
          가입
        </button>
      </form>
      <Link to="/login">
        <button type="button" className="login-btn">로그인</button>
      </Link>
      <div>{msg}</div>
      <SignupModal
        open={modal.open}
        message={modal.message}
        onClose={() => setModal({ ...modal, open: false })}
      />
    </div>
  );
}
