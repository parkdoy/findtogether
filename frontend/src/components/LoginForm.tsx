import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './LoginForm.css';

export interface UserProfile {
  name: string;
  email: string;
  picture?: string;
}

interface LoginFormProps {
  onLoginSuccess: (userProfile: UserProfile) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    // Simulate a successful login for email/password
    console.log('Logging in with', { email, password });
    setError('');
    // For email/password, we don't have a full profile, so we pass a mock one
    onLoginSuccess({ name: email.split('@')[0], email });
  };

  const handleGoogleLoginSuccess = (credentialResponse: CredentialResponse) => {
    console.log('Google Login Success:', credentialResponse);
    if (credentialResponse.credential) {
      const decoded: UserProfile = jwtDecode(credentialResponse.credential);
      onLoginSuccess(decoded);
    } else {
      setError('Google login failed: No credential received.');
    }
  };

  const handleGoogleLoginError = () => {
    console.log('Google Login Failed');
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>로그인</h2>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="login-button">로그인</button>
        <button type="button" className="signup-button" onClick={onSwitchToRegister}>회원가입</button>

        <div className="divider">OR</div>

        <div className="google-login-container">
            <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap
            />
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
