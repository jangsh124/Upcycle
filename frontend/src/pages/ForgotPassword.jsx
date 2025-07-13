import React, { useState } from 'react';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/auth/forgot-password', { email });
      setMsg('메일을 확인하세요');
    } catch (err) {
      setMsg('에러가 발생했습니다');
    }
  };

  return (
    <div className="login-container">
      <h2>비밀번호 찾기</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br />
        <button type="submit">전송</button>
      </form>
      <div>{msg}</div>
    </div>
  );
}
