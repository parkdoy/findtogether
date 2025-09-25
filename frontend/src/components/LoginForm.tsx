import React, { useState } from 'react';
import { auth } from '../firebase'; // Import the auth instance
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth'; // Import the function
import './LoginForm.css';

export interface UserProfile {
  uid: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userProfile: UserProfile = {
        name: user.displayName || user.email || 'Unknown User',
        uid: user.uid,
        email: user.email || '',
        picture: user.photoURL || undefined,
      };
      onLoginSuccess(userProfile);
    } catch (err: any) {
      console.error('Firebase login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else {
        setError(err.message || 'An unknown error occurred during login.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userProfile: UserProfile = {
        name: user.displayName || user.email || 'Unknown User',
        uid: user.uid,
        email: user.email || '',
        picture: user.photoURL || undefined,
      };
      onLoginSuccess(userProfile);
    } catch (error: any) {
      console.error("Google Sign-In Error", error);
      setError(`Google Sign-In failed: ${error.message}`);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>로그인</h2>
        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            type="email"
            id="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="login-button">로그인</button>
        <button type="button" className="signup-button" onClick={onSwitchToRegister}>회원가입</button>

        <div className="divider">OR</div>

        <button type="button" className="google-login-button" onClick={handleGoogleSignIn}>
          <img src="/Google_icon-Sep15.svg" alt="Google logo" />
          <span>Google 계정으로 로그인</span>
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
