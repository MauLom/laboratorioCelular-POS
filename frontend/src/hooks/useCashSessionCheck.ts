import { useEffect } from 'react';

/**
 * Hook personalizado para forzar la verificación de sesión de caja
 * Se ejecuta al montar el componente que lo use
 */
export const useCashSessionCheck = () => {
  useEffect(() => {
    // Verificar estado de caja al montar el componente
    if (typeof window !== 'undefined' && (window as any).forceCheckCashSession) {
      (window as any).forceCheckCashSession();
    }
  }, []);
};

export default useCashSessionCheck;