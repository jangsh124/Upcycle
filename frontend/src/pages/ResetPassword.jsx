import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [params] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/auth/reset-password', {
        token: params.get('token'),
        password,
      });
      setMsg('비밀번호가 변경되었습니다');
    } catch (err) {
      setMsg('에러가 발생했습니다');
    }
  };

  return (
    <div>
      <h2>비밀번호 재설정</h2>
      <form onSubmit={handleSubmit}>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">변경</button>
      </form>
      <div>{msg}</div>
    </div>
  );
}