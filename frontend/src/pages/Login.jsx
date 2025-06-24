import React, { useState } from "react";
import axios from "axios";

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // POST: 백엔드 로그인 API 호출 (URL은 예시)
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        email,
        password: pw,
      });
      setMsg("로그인 성공: " + res.data.user.email);
    } catch (err) {
      setMsg("에러: " + (err.response?.data?.error || "로그인 실패"));
    }
  };

  return (
    <div className="login-container">
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
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
        <button type="submit">로그인</button>
      </form>
            <button type="button" onClick={onSwitch}>회원가입</button>
      <div>{msg}</div>
    </div>
  );
}
