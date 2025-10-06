import { useNotification } from '../contexts/NotificationContext';

export const useAlert = () => {
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotification();

  const alert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
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
  };

  const success = (message: string) => {
    notifySuccess('Éxito', message);
  };

  const error = (message: string) => {
    notifyError('Error', message);
  };

  const warning = (message: string) => {
    notifyWarning('Advertencia', message);
  };

  const info = (message: string) => {
    notifyInfo('Información', message);
  };

  return {
    alert,
    success,
    error,
    warning,
    info,
  };
};

export default useAlert;
