import { useState } from 'react';
import LoginForm, { type UserProfile } from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthFormProps {
  onLoginSuccess: (userProfile: UserProfile) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  const switchToRegister = () => {
    setIsRegistering(true);
  };

  const switchToLogin = () => {
    setIsRegistering(false);
  };

  return (
    isRegistering ? (
      <RegisterForm onSwitchToLogin={switchToLogin} />
    ) : (
      <LoginForm 
        onLoginSuccess={onLoginSuccess} 
        onSwitchToRegister={switchToRegister} 
      />
    )
  );
};

export default AuthForm;
