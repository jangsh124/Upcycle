import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login({ setUserEmail }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password: pw,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userEmail", res.data.user.email);
      setUserEmail(res.data.user.email);
      
      navigate("/"); // 로그인 성공 시 메인 페이지로
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
      <Link to="/signup">
        <button type="button">회원가입</button>
      </Link>
      <div>{msg}</div>
      <Link to="/forgot-password">비밀번호를 잊으셨나요?</Link>
    </div>
  );
}
