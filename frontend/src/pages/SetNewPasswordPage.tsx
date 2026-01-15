import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  padding: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
`;

const Title = styled.h1`
  color: #2c3e50;
  text-align: center;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 30px;
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => props.hasError ? '#e74c3c' : '#e0e0e0'};
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#e74c3c' : '#3498db'};
  }

  &:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #f44336;
  font-size: 14px;
  margin-top: 4px;
`;

const SuccessMessage = styled.div`
  background: #e8f5e9;
  color: #2e7d32;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
  font-size: 14px;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 10px;

  &:hover:not(:disabled) {
    background: #2980b9;
  }

  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
`;

const PasswordToggle = styled.button`
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  margin-top: 4px;
  text-align: left;
  
  &:hover {
    color: #2c3e50;
  }
`;

interface ValidationErrors {
  password?: string[];
  confirmPassword?: string;
}

const SetNewPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, setRequiresPasswordChange } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validatePassword = (pwd: string): string[] => {
    const validationErrors: string[] = [];
    
    if (pwd.length < 8) {
      validationErrors.push('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(pwd)) {
      validationErrors.push('La contraseña debe contener al menos una letra mayúscula');
    }
    if (!/[a-z]/.test(pwd)) {
      validationErrors.push('La contraseña debe contener al menos una letra minúscula');
    }
    if (!/[0-9]/.test(pwd)) {
      validationErrors.push('La contraseña debe contener al menos un número');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) {
      validationErrors.push('La contraseña debe contener al menos un carácter especial');
    }
    
    return validationErrors;
  };

  const isPasswordValid = (): boolean => {
    if (!password) return false;
    const passwordErrors = validatePassword(password);
    return passwordErrors.length === 0 && password === confirmPassword;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Clear errors when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    
    // Validate confirm password match
    if (confirmPassword && newPassword !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
    } else if (confirmPassword && newPassword === confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    if (newConfirmPassword && password !== newConfirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setErrors({ password: passwordErrors });
      return;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);
    try {
      await authApi.setNewPassword({
        newPassword: password,
        confirmPassword: confirmPassword
      });
      
      // Clear requiresPasswordChange flag
      localStorage.removeItem('requiresPasswordChange');
      setRequiresPasswordChange(false);
      
      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al establecer la contraseña';
      const errorDetails = error.response?.data?.errors || [];
      
      if (errorDetails.length > 0) {
        setErrors({ password: errorDetails });
      } else {
        setErrors({ password: [errorMessage] });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Container>
      <Card>
        <Title>Establecer Nueva Contraseña</Title>
        <Subtitle>Por favor, establece una nueva contraseña para tu cuenta</Subtitle>
        
        {success && (
          <SuccessMessage>
            ✓ Contraseña establecida exitosamente. Redirigiendo...
          </SuccessMessage>
        )}
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="password">Nueva Contraseña</Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              disabled={loading || success}
              placeholder="Ingresa tu nueva contraseña"
              autoComplete="new-password"
              hasError={!!errors.password}
              autoFocus
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'} contraseña
            </PasswordToggle>
            {password && <PasswordStrengthIndicator password={password} />}
            {errors.password && errors.password.length > 0 && (
              <ErrorMessage>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {errors.password.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </ErrorMessage>
            )}
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={loading || success}
              placeholder="Confirma tu nueva contraseña"
              autoComplete="new-password"
              hasError={!!errors.confirmPassword}
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? 'Ocultar' : 'Mostrar'} contraseña
            </PasswordToggle>
            {errors.confirmPassword && (
              <ErrorMessage>{errors.confirmPassword}</ErrorMessage>
            )}
          </InputGroup>
          
          <Button type="submit" disabled={loading || success || !isPasswordValid()}>
            {loading ? 'Estableciendo contraseña...' : success ? '✓ Contraseña Establecida' : 'Establecer Contraseña'}
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default SetNewPasswordPage;

