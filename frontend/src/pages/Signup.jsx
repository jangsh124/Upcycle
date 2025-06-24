import React, { useState } from "react";
import axios from "axios";

export default function Signup({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // POST: 백엔드 회원가입 API 호출 (URL은 예시)
      const res = await axios.post("http://localhost:5001/api/auth/signup", {
        email,
        password: pw,
      });
      setMsg("회원가입 성공: " + res.data.user.email);
    } catch (err) {
      setMsg("에러: " + (err.response?.data?.error || "회원가입 실패"));
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
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        /><br />
        <button type="submit">가입</button>
      </form>
      <button type="button" onClick={onSwitch}>로그인</button>
      <div>{msg}</div>
    </div>
  );
}
