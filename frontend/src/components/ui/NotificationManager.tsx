import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useNotification, Notification, NotificationType } from '../../contexts/NotificationContext';

// Animations
const slideInRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOutRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

// Styled Components
const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
  }
`;

const NotificationItem = styled.div<{ type: NotificationType; isRemoving?: boolean }>`
  background: ${({ type }) => {
    switch (type) {
      case 'success': return 'linear-gradient(135deg, #27ae60, #2ecc71)';
      case 'error': return 'linear-gradient(135deg, #e74c3c, #ec7063)';
      case 'warning': return 'linear-gradient(135deg, #f39c12, #f7dc6f)';
      case 'info': return 'linear-gradient(135deg, #3498db, #5dade2)';
      default: return 'linear-gradient(135deg, #34495e, #5d6d7e)';
    }
  }};
  
  color: ${({ type }) => type === 'warning' ? '#2c3e50' : 'white'};
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 320px;
  max-width: 400px;
  pointer-events: all;
  position: relative;
  overflow: hidden;
  
  animation: ${({ isRemoving }) => isRemoving ? slideOutRight : slideInRight} 0.3s ease-out forwards;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.3);
  }
  
  @media (max-width: 768px) {
    min-width: unset;
    max-width: unset;
    width: 100%;
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
`;

const NotificationIcon = styled.div<{ type: NotificationType }>`
  font-size: 20px;
  margin-right: 12px;
  flex-shrink: 0;
  
  &::before {
    content: ${({ type }) => {
      switch (type) {
        case 'success': return '"✓"';
        case 'error': return '"✕"';
        case 'warning': return '"⚠"';
        case 'info': return '"ℹ"';
        default: return '"•"';
      }
    }};
  }
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.h4`
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
`;

const NotificationMessage = styled.p`
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
  line-height: 1.3;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: inherit;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const ProgressBar = styled.div<{ duration: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.4);
  animation: shrink ${props => props.duration}ms linear forwards;
  
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

interface NotificationItemComponentProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItemComponent: React.FC<NotificationItemComponentProps> = ({ 
  notification, 
  onRemove 
}) => {
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  return (
    <NotificationItem type={notification.type} isRemoving={isRemoving}>
      <NotificationHeader>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <NotificationIcon type={notification.type} />
          <NotificationContent>
            <NotificationTitle>{notification.title}</NotificationTitle>
            {notification.message && (
              <NotificationMessage>{notification.message}</NotificationMessage>
            )}
            {notification.action && (
              <ActionButton onClick={notification.action.onClick}>
                {notification.action.label}
              </ActionButton>
            )}
          </NotificationContent>
        </div>
        <CloseButton onClick={handleRemove}>×</CloseButton>
      </NotificationHeader>
      
      {notification.duration && notification.duration > 0 && (
        <ProgressBar duration={notification.duration} />
      )}
    </NotificationItem>
  );
};

const NotificationManager: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <NotificationContainer>
      {notifications.map((notification) => (
        <NotificationItemComponent
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </NotificationContainer>
  );
};

export default NotificationManager;
