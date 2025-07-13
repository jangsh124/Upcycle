import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import "./ResetPassword.css";
import SignupModal from "../components/Modal";

export default function ResetPassword({ setUserEmail }) {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      setError('유효하지 않은 접근입니다.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setModalMsg('비밀번호를 입력해주세요.');
      setModalOpen(true);
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^+=-])[A-Za-z\d@$!%*#?&^+=-]{8,}$/;
    if (!passwordRegex.test(password)) {
      setModalMsg("비밀번호는 최소 8자, 영문, 숫자, 특수문자를 모두 포함해야 합니다.");
      setModalOpen(true);
      return;
    }

    try {
      await axios.post('http://localhost:5001/api/auth/reset-password', {
        token,
        password,
      });

      setMsg('비밀번호가 성공적으로 변경되었습니다.');
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        if (setUserEmail) setUserEmail("");
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setModalMsg(
        err.response?.data?.error || '토큰이 유효하지 않거나 만료되었습니다.'
      );
      setModalOpen(true);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* 모달 위치는 어디든 OK, 보통 맨 위 */}
      <SignupModal
        open={modalOpen}
        message={modalMsg}
        onClose={() => setModalOpen(false)}
      />

      <h2>🔐 비밀번호 재설정</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {!msg && !error && (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="새 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '8px', marginRight: '10px' }}
          />
          <div className="password-policy">
            비밀번호는 <b>최소 8자</b>이고, <span className="pw-color-red">영문</span>, <span className="pw-color-blue">숫자</span>, <span className="pw-color-green">특수문자</span>를 모두 포함해야 합니다.
          </div>
          <button type="submit" style={{ padding: '8px' }}>
            변경
          </button>
        </form>
      )}
    </div>
  );
}
