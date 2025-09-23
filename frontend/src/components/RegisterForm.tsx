import React, { useState } from 'react';
import './RegisterForm.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !email || !username) {
      setError('All fields are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register');
      }

      alert('Registration successful! Please log in.');
      onSwitchToLogin(); // Switch back to login form after registration
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An unknown error occurred.');
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>회원가입</h2>
        <div className="form-group">
          <label htmlFor="register-email">이메일 주소</label>
          <input type="email" id="register-email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="register-password">비밀번호</label>
          <input type="password" id="register-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="username">사용자 이름 (닉네임)</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="register-button">회원가입</button>
        <p className="switch-link">
          이미 계정이 있으신가요? <button type="button" onClick={onSwitchToLogin}>로그인</button>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
