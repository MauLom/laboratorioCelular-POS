import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { cashSessionApi, franchiseLocationsApi, configurationsApi } from '../../services/api';
import { deviceTrackerApi } from '../../services/deviceTrackerApi';
import CashOpenModal from './CashOpenModal';

interface CashSessionProviderProps {
  children: React.ReactNode;
}

const  CashSessionProvider: React.FC<CashSessionProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [showCashModal, setShowCashModal] = useState(false);
  const [franchiseName, setFranchiseName] = useState('');
  const [franchiseId, setFranchiseId] = useState('');
  const [isValidFranchise, setIsValidFranchise] = useState(false);
  
  // Flags para evitar múltiples ejecuciones simultáneas
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Configuration for which roles should receive the cash modal
  const [cashModalRoles, setCashModalRoles] = useState<Set<string>>(new Set());
  const [configLoaded, setConfigLoaded] = useState(false);
  
  // Load cash modal configuration
  const loadCashModalConfig = useCallback(async () => {
    // Only load config if user is authenticated
    if (!isAuthenticated || !user) {
      setConfigLoaded(true); // Mark as loaded to prevent blocking, but use defaults
      const defaultRoles = new Set([
        'Cajero',
        'Vendedor',
        'Supervisor de sucursal',
        'Oficina'
      ]);
      setCashModalRoles(defaultRoles);
      return;
    }

    try {
      const config = await configurationsApi.getByKey('cash_modal_roles');
      if (config && config.values && Array.isArray(config.values) && config.values.length > 0) {
        const enabledRoles = new Set<string>();
        config.values.forEach((v: any) => {
          if (v.isActive !== false && v.value) {
            enabledRoles.add(v.value);
          }
        });
        setCashModalRoles(enabledRoles);
      } else {
        // Default: all roles except admin roles (fallback if config doesn't exist or is empty)
        const defaultRoles = new Set([
          'Cajero',
          'Vendedor',
          'Supervisor de sucursal',
          'Oficina'
        ]);
        setCashModalRoles(defaultRoles);
      }
    } catch (err: any) {
      // If it's a 401, don't log error (user is not authenticated)
      if (err.response?.status === 401) {
        setConfigLoaded(true);
        const defaultRoles = new Set([
          'Cajero',
          'Vendedor',
          'Supervisor de sucursal',
          'Oficina'
        ]);
        setCashModalRoles(defaultRoles);
        return;
      }
      // If it's a 404, config doesn't exist yet - use defaults
      if (err.response?.status === 404) {
        const defaultRoles = new Set([
          'Cajero',
          'Vendedor',
          'Supervisor de sucursal',
          'Oficina'
        ]);
        setCashModalRoles(defaultRoles);
        setConfigLoaded(true);
        return;
      }
      console.warn('Error loading cash modal config, using defaults:', err);
      // Default: all roles except admin roles (fallback on error)
      const defaultRoles = new Set([
        'Cajero',
        'Vendedor',
        'Supervisor de sucursal',
        'Oficina'
      ]);
      setCashModalRoles(defaultRoles);
    } finally {
      setConfigLoaded(true);
    }
  }, [isAuthenticated, user]);
  
  // Función para determinar si el usuario necesita sesión de caja
  const userNeedsCashSession = useCallback((): boolean => {
    if (!user || !configLoaded) return false;
    
    // Check if user's role is in the configured list of roles that should receive the modal
    return cashModalRoles.has(user.role);
  }, [user, cashModalRoles, configLoaded]);
  
  const getCurrentFranchise = async () => {
    try {
      
      // Obtener todas las franquicias activas
      const locations = await franchiseLocationsApi.getActive();
      
      // Obtener GUID del sistema
      const systemGuid = await deviceTrackerApi.getSystemGuid();
      
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

  const checkCashSession = useCallback(async () => {
    if (!isAuthenticated || !user || isCheckingSession) {
      return;
    }
    
    // Si el usuario no necesita sesión de caja, no mostrar el modal
    if (!userNeedsCashSession()) {
      setShowCashModal(false);
      return;
    }
    
    setIsCheckingSession(true);
    
    try {
      const franchiseIdToCheck = await getCurrentFranchise();
      
      if (franchiseIdToCheck) {
        try {
          const sessionStatus = await cashSessionApi.checkTodaySession(franchiseIdToCheck);
          
          if (!sessionStatus.hasSession) {
            setShowCashModal(true);
          } else {
            setShowCashModal(false);
          }
        } catch (apiError) {
          console.error('Error checking session:', apiError);
          setShowCashModal(true);
        }
      } else {
        setShowCashModal(true);
      }
    } catch (error) {
      console.error('Error in checkCashSession:', error);
      setShowCashModal(userNeedsCashSession());
    } finally {
      setIsCheckingSession(false);
    }
  }, [isAuthenticated, user, isCheckingSession, userNeedsCashSession]);

  // Función para forzar verificación desde componentes externos
  const forceCheckCashSession = useCallback(() => {
    if (isAuthenticated && user && !isCheckingSession) {
      checkCashSession();
    }
  }, [isAuthenticated, user, isCheckingSession, checkCashSession]);

  // Load configuration only when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Reset initialization state when user changes
      setHasInitialized(false);
      setConfigLoaded(false); // Reset to load fresh config for new user
      loadCashModalConfig();
    } else {
      // If not authenticated, reset state and set defaults (mark as loaded to prevent blocking)
      setConfigLoaded(true);
      setHasInitialized(false);
      setShowCashModal(false);
      const defaultRoles = new Set([
        'Cajero',
        'Vendedor',
        'Supervisor de sucursal',
        'Oficina'
      ]);
      setCashModalRoles(defaultRoles);
    }
  }, [isAuthenticated, user, loadCashModalConfig]);

  useEffect(() => {
    if (isAuthenticated && user && !hasInitialized && configLoaded) {
      // Marcar como inicializado para evitar múltiples ejecuciones
      setHasInitialized(true);
      // Pequeño delay para asegurar que el login se complete
      setTimeout(checkCashSession, 1000);
    }

    // Listener para cambios de visibilidad (cuando vuelve a la pestaña)
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user && !isCheckingSession && configLoaded) {
        checkCashSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

  }, [isAuthenticated, user, hasInitialized, isCheckingSession, checkCashSession, configLoaded]);


  // Exponer la función globalmente para que otros componentes puedan usarla
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).forceCheckCashSession = forceCheckCashSession;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).forceCheckCashSession;
      }
    };
  }, [isAuthenticated, user, forceCheckCashSession]);

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