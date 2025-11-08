import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export const useAlert = () => {
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotification();

  const alert = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    switch (type) {
      case 'success':
        notifySuccess('Éxito', message);
        break;
      case 'error':
        notifyError('Error', message);
        break;
      case 'warning':
        notifyWarning('Advertencia', message);
        break;
      case 'info':
        notifyInfo('Información', message);
        break;
    }
  }, [notifySuccess, notifyError, notifyWarning, notifyInfo]);

  const success = useCallback((message: string) => {
    notifySuccess('Éxito', message);
  }, [notifySuccess]);

  const error = useCallback((message: string) => {
    notifyError('Error', message);
  }, [notifyError]);

  const warning = useCallback((message: string) => {
    notifyWarning('Advertencia', message);
  }, [notifyWarning]);

  const info = useCallback((message: string) => {
    notifyInfo('Información', message);
  }, [notifyInfo]);

  return {
    alert,
    success,
    error,
    warning,
    info,
  };
};

export default useAlert;
