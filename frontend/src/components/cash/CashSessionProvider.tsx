import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cashSessionApi, franchiseLocationsApi } from '../../services/api';
import CashOpenModal from './CashOpenModal';

interface CashSessionProviderProps {
  children: React.ReactNode;
}

const  CashSessionProvider: React.FC<CashSessionProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [showCashModal, setShowCashModal] = useState(false);
  const [franchiseName, setFranchiseName] = useState('');
  const [franchiseId, setFranchiseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [isValidFranchise, setIsValidFranchise] = useState(false);
  const [activeCashSession, setActiveCashSession] = useState<any>(null);
  
  // Flags para evitar múltiples ejecuciones simultáneas
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Cache para el GUID y franquicia para evitar múltiples llamadas
  const [cachedGuid, setCachedGuid] = useState<string | null>(null);
  const [guidLastFetch, setGuidLastFetch] = useState<number>(0);

  // Función para obtener el GUID del sistema con cache
  const fetchSystemGuid = async (): Promise<string | null> => {
    const now = Date.now();
    const CACHE_DURATION = 30000; // 30 segundos de cache
    
    // Si tenemos un GUID en cache y no ha expirado, usarlo
    if (cachedGuid && (now - guidLastFetch) < CACHE_DURATION) {
      return cachedGuid;
    }
    
    try {
      const winServiceUrl = process.env.REACT_APP_WIN_SERVICE_URL || 'http://localhost:5005';      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${winServiceUrl}/api/system/guid`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const guid = data.guid || data.systemGuid || null;
        
        // Actualizar cache
        setCachedGuid(guid);
        setGuidLastFetch(now);
        
        return guid;
      } else {
        return null;
      }
    } catch (error: any) {
      return null;
    }
  };

  const getCurrentFranchise = async () => {
    try {
      
      // Obtener todas las franquicias activas
      const locations = await franchiseLocationsApi.getActive();
      
      // Obtener GUID del sistema
      const systemGuid = await fetchSystemGuid();
      
      if (systemGuid) {
        // Buscar franquicia que coincida con el GUID
        const matchingFranchise = locations.find(location => location.guid === systemGuid);
        
        if (matchingFranchise) {
          setFranchiseId(matchingFranchise._id!);
          setFranchiseName(matchingFranchise.name);
          setIsValidFranchise(true);
          return matchingFranchise._id!;
        } else {
          // No se encontró franquicia con este GUID
          setFranchiseId('');
          setFranchiseName('Franquicia no encontrada (GUID: ' + systemGuid.substring(0, 8) + '...)');
          setIsValidFranchise(false);
          return null;
        }
      } else {
        // Sin GUID, no podemos determinar la franquicia
        setFranchiseId('');
        setFranchiseName('Servicio de sistema no disponible');
        setIsValidFranchise(false);
        return null;
      }
    } catch (error) {
      setFranchiseId('');
      setFranchiseName('Error al obtener franquicia');
      setIsValidFranchise(false);
      return null;
    }
  };

  const checkCashSession = async () => {
    if (!isAuthenticated || !user || isCheckingSession) {
      return;
    }
    
    setIsCheckingSession(true);
    setLoading(true);
    
    try {
      const franchiseIdToCheck = await getCurrentFranchise();
      
      if (franchiseIdToCheck) {
        try {
          const sessionStatus = await cashSessionApi.checkTodaySession(franchiseIdToCheck);
          
          console.log('Session status:', sessionStatus);
          
          // Si no hay sesión activa hoy, mostrar modal
          if (!sessionStatus.hasSession) {
            setShowCashModal(true);
            setActiveCashSession(null);
          } else {
            setShowCashModal(false);
            setActiveCashSession(sessionStatus.session);
          }
        } catch (apiError) {
          console.error('Error checking session:', apiError);
          setShowCashModal(true);
          setActiveCashSession(null);
        }
      } else {
        // Mostrar modal incluso sin franquicia válida para informar al usuario
        setShowCashModal(true);
        setActiveCashSession(null);
      }
    } catch (error) {
      console.error('Error in checkCashSession:', error);
      // Si hay error, mostrar modal por seguridad
      setShowCashModal(true);
      setActiveCashSession(null);
    } finally {
      setLoading(false);
      setIsCheckingSession(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && !hasInitialized) {
      // Marcar como inicializado para evitar múltiples ejecuciones
      setHasInitialized(true);
      // Pequeño delay para asegurar que el login se complete
      setTimeout(checkCashSession, 1000);
    }

    // Listener para cambios de visibilidad (cuando vuelve a la pestaña)
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user && !isCheckingSession) {
        checkCashSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

  }, [isAuthenticated, user, hasInitialized, isCheckingSession]);

  const handleCashModalClose = () => {
    setShowCashModal(false);
  };

  const handleCashSuccess = () => {
    setShowCashModal(false);
    // Recargar estado para obtener la sesión recién creada
    setTimeout(() => {
      if (!isCheckingSession) {
        checkCashSession();
      }
    }, 500);
  };

  return (
    <>
      {children}
      <CashOpenModal
        isOpen={showCashModal}
        onClose={handleCashModalClose}
        franchiseName={franchiseName || 'Cargando...'}
        franchiseId={franchiseId}
        isValidFranchise={isValidFranchise}
        onSuccess={handleCashSuccess}
      />
    </>
  );
};

export default CashSessionProvider;