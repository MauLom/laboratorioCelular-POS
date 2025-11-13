import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { LoginRequest } from '../types';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
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

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
  }

  &:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }
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

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #f44336;
  margin-bottom: 20px;
  font-size: 14px;
`;

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginRequest>({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  
  const { login, loading, isAuthenticated, requiresPasswordChange } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    // If password change is required, redirect to set-new-password
    if (requiresPasswordChange) {
      return <Navigate to="/set-new-password" replace />;
    }
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!credentials.username || !credentials.password) {
      setError('Por favor, ingresa usuario y contraseña');
      return;
    }

    try {
      // Login will store token and set requiresPasswordChange flag
      // Token is stored even if password change is required
      const result = await login(credentials);
      
      // Check requiresPasswordChange from login response
      if (result.requiresPasswordChange) {
        // Redirect to set-new-password if password change is required
        navigate('/set-new-password', { replace: true });
      } else {
        // Normal redirect to home or intended destination
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>Laboratorio Celular POS</Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="username">Usuario o Email</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={credentials.username}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Ingresa tu usuario o email"
              autoComplete="username"
              autoFocus
            />
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
            />
          </InputGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;