import React, { useState } from 'react';
import './RegisterForm.css';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !password || !email || !username) {
      setError('All fields are required');
      return;
    }
    // In a real app, you would call a registration API here
    console.log('Registering with', { id, password, email, username });
    setError('');
    alert('Registration successful! Please log in.');
    onSwitchToLogin(); // Switch back to login form after registration
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>회원가입</h2>
        <div className="form-group">
          <label htmlFor="id">아이디</label>
          <input type="text" id="id" value={id} onChange={(e) => setId(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="email">이메일 주소</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
