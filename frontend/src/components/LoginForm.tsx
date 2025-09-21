import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import './LoginForm.css';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    // Simulate a successful login
    // In a real app, you would call an authentication API here
    console.log('Logging in with', { email, password });
    setError('');
    onLoginSuccess();
  };

  const handleSignUpClick = () => {
    // In a real app, you would navigate to a sign-up page
    console.log('Navigate to sign up');
  };

  const handleGoogleLoginSuccess = (credentialResponse: CredentialResponse) => {
    console.log('Google Login Success:', credentialResponse);
    // In a real app, you would send the credential to your backend for verification
    // and to create a session or JWT.
    onLoginSuccess();
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
        <button type="button" className="signup-button" onClick={handleSignUpClick}>회원가입</button>

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
