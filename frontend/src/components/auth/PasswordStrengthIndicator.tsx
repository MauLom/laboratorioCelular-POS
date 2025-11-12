import React from 'react';
import styled from 'styled-components';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface StrengthLevel {
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  percentage: number;
  color: string;
  label: string;
}

const Container = styled.div`
  margin-top: 12px;
`;

const StrengthBar = styled.div<{ percentage: number; color: string }>`
  height: 6px;
  background: ${props => props.color};
  width: ${props => props.percentage}%;
  border-radius: 3px;
  transition: all 0.3s ease;
  margin-bottom: 12px;
`;

const StrengthLabel = styled.div<{ color: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.color};
  margin-bottom: 12px;
`;

const RequirementsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RequirementItem = styled.li<{ met: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${props => props.met ? '#27ae60' : '#7f8c8d'};
  
  &::before {
    content: ${props => props.met ? '"✓"' : '"○"'};
    color: ${props => props.met ? '#27ae60' : '#bdc3c7'};
    font-weight: bold;
    font-size: 16px;
  }
`;

const calculateStrength = (password: string): StrengthLevel => {
  if (!password) {
    return { level: 'weak', percentage: 0, color: '#e74c3c', label: '' };
  }

  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    long: password.length >= 12
  };

  if (checks.length) strength += 20;
  if (checks.uppercase) strength += 20;
  if (checks.lowercase) strength += 20;
  if (checks.number) strength += 20;
  if (checks.special) strength += 20;
  if (checks.long) strength += 10; // Bonus for longer passwords

  if (strength <= 40) {
    return { level: 'weak', percentage: strength, color: '#e74c3c', label: 'Débil' };
  } else if (strength <= 60) {
    return { level: 'medium', percentage: strength, color: '#f39c12', label: 'Media' };
  } else if (strength <= 80) {
    return { level: 'strong', percentage: strength, color: '#3498db', label: 'Fuerte' };
  } else {
    return { level: 'very-strong', percentage: Math.min(strength, 100), color: '#27ae60', label: 'Muy Fuerte' };
  }
};

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const strength = calculateStrength(password);
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  if (!password) {
    return null;
  }

  return (
    <Container>
      {strength.label && (
        <StrengthLabel color={strength.color}>
          Fortaleza: {strength.label}
        </StrengthLabel>
      )}
      <StrengthBar percentage={strength.percentage} color={strength.color} />
      <RequirementsList>
        <RequirementItem met={checks.length}>
          Al menos 8 caracteres
        </RequirementItem>
        <RequirementItem met={checks.uppercase}>
          Al menos una letra mayúscula
        </RequirementItem>
        <RequirementItem met={checks.lowercase}>
          Al menos una letra minúscula
        </RequirementItem>
        <RequirementItem met={checks.number}>
          Al menos un número
        </RequirementItem>
        <RequirementItem met={checks.special}>
          Al menos un carácter especial (!@#$%^&*...)
        </RequirementItem>
      </RequirementsList>
    </Container>
  );
};

export default PasswordStrengthIndicator;

