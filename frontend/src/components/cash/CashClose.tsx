import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Button, Flex, Input, SimpleGrid, VStack } from '@chakra-ui/react';
import Navigation from '../common/Navigation';
import { franchiseLocationsApi, cashSessionApi, salesApi } from '../../services/api';
import { listExpenses } from '../../services/expenses';
import type { Expense } from '../../types/expense';
import { deviceTrackerApi } from '../../services/deviceTrackerApi';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../hooks/useAlert';
import styled from 'styled-components';

const Page = styled.div`
  min-height: 98vh;
  background: #f8f9fa;
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
`;

const CashClose: React.FC = () => {
  const { user, logout } = useAuth();
  const { success, error: alertError } = useAlert();
  const [franchiseName, setFranchiseName] = useState('');
  const [franchiseId, setFranchiseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closingCash, setClosingCash] = useState(false);
  const [loadingSalesData, setLoadingSalesData] = useState(false);
  
  // Estados para los campos de cierre de caja
  const [corte, setCorte] = useState('');
  const [feria, setFeria] = useState('');
  const [tarjeta, setTarjeta] = useState('');
  const [dolar, setDolar] = useState('');
  const [salida, setSalida] = useState('');
  
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  
  const [dailyExpenses, setDailyExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);

  const [oldOpenSession, setOldOpenSession] = useState<any | null>(null);
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);

  const getCurrentFranchise = async () => {
    try {
      setLoading(true);
      
      const locations = await franchiseLocationsApi.getActive();
      const systemGuid = await deviceTrackerApi.getSystemGuid();
      
      if (systemGuid) {
        const matchingFranchise = locations.find(location => location.guid === systemGuid);
        
        if (matchingFranchise) {
          setFranchiseName(matchingFranchise.name);
          setFranchiseId(matchingFranchise._id!);
        } else {
          setError('Franquicia no encontrada para este sistema');
        }
      } else {
        setError('No se pudo obtener el identificador del sistema');
      }
    } catch (error) {
      setError('Error al obtener información de la franquicia');
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular los montos del día
  const loadTodaysSalesData = useCallback(async () => {
    if (!franchiseId) return;

    try {
      setLoadingSalesData(true);
      
      // Obtener la sesión de caja del día para el tipo de cambio
      const sessionStatus = await cashSessionApi.checkTodaySession(franchiseId);
      let currentExchangeRate = 1;
      
      if (sessionStatus.hasSession && sessionStatus.session?.exchange_rate_usd_mxn) {
        currentExchangeRate = sessionStatus.session.exchange_rate_usd_mxn;
        setExchangeRate(currentExchangeRate);
      }

      // Obtener ventas del día
      const allSales = await salesApi.getTodaysByFranchise(franchiseId);
      
      // Obtener rango del día en zona horaria de Monterrey
      const monterreyNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Monterrey" })
      );

      const start = new Date(
        monterreyNow.getFullYear(),
        monterreyNow.getMonth(),
        monterreyNow.getDate(),
        0, 0, 0
      );

      const end = new Date(
        monterreyNow.getFullYear(),
        monterreyNow.getMonth(),
        monterreyNow.getDate(),
        23, 59, 59
      );

      const todaysSales = allSales.filter(sale => {
        if (!sale.createdAt) return false;

        const saleDate = new Date(
          new Date(sale.createdAt).toLocaleString("en-US", { timeZone: "America/Monterrey" })
        );

        return saleDate >= start && saleDate <= end;
      });
            
      // Calcular montos por tipo de pago
      let totalCard = 0;
      let totalUSD = 0;
      let totalCash = 0;
      let totalSales = 0;

      todaysSales.forEach((sale) => {
        totalSales += sale.amount || 0;

        if (!sale.paymentMethods || !Array.isArray(sale.paymentMethods)) return;
        sale.paymentMethods.forEach((payment) => {
          const amount = payment.amount || 0;
          const type = (payment.type || "").toLowerCase();

          if (type === "tarjeta" || type === "card") {
            totalCard += amount;
          } else if (type === "dolar" || type === "usd") {
            totalUSD += amount;
          } else if (type === "efectivo" || type === "cash") {
            totalCash += amount;
          }
        });
      });

      // Obtener gastos del día primero para poder ajustar el efectivo
      try {
        const today = new Date();
        const localDate = today.toLocaleDateString('en-CA', { timeZone: 'America/Monterrey' });
        const expenses = await listExpenses({ from: localDate, to: localDate });
        
        setDailyExpenses(expenses);
        
        const expensesTotal = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        setTotalExpenses(expensesTotal);
        const efectivoFisicoMx = totalSales - totalCard - expensesTotal;

        setCorte(totalSales.toFixed(2));
        setFeria(efectivoFisicoMx.toFixed(2));
        setTarjeta(totalCard.toFixed(2));
        setDolar(totalUSD.toFixed(2));
        
      } catch (expError) {
        setDailyExpenses([]);
        setTotalExpenses(0);
        
        // Si no se pueden cargar gastos, usar valores sin ajustar
        setCorte(totalSales.toFixed(2));
        setFeria(totalCash.toFixed(2));
        setTarjeta(totalCard.toFixed(2));
        setDolar(totalUSD.toFixed(2));
      }

    } catch (error: any) {
      alertError('Error al cargar los datos de ventas del día');
    } finally {
      setLoadingSalesData(false);
    }
  }, [franchiseId, alertError]);

  const loadAnyOpenSession = useCallback(async () => {
    if (!franchiseId) return;
    try {
      const session = await cashSessionApi.findAnyOpenSession(franchiseId);

      if (session && session.status === "open") {
        const openDate = new Date(session.openDateTime);
        const today = new Date();

        const isSameDay =
         openDate.getFullYear() === today.getFullYear() &&
         openDate.getMonth() === today.getMonth() &&
         openDate.getDate() === today.getDate();

        if (isSameDay) {
          setOldOpenSession(session);
        } else {
          setOldOpenSession(null);
        }
      } else {
        if (
          user?.role &&
          ["Master admin", "Administrador", "Supervisor de oficina", "Supervisor de sucursales"].includes(user.role)
        ) {
          const history = await cashSessionApi.getHistory(franchiseId, { limit: 1 });
          if (history.sessions.length > 0) {
            setOldOpenSession(history.sessions[0]);
          } else {
            setOldOpenSession(null);
          }
        } else {
          setOldOpenSession(null);
        }
      }    
    } catch (e) {
      setOldOpenSession(null);
   }
  }, [franchiseId, user?.role]);

  const loadPendingSessionsAllBranches = useCallback(async () => {
    try {
      if (
        !user ||
        !["Master admin", "Administrador", "Supervisor de oficina", "Supervisor de sucursales"].includes(user.role)
      ) {
        return;
      }

      const locations = await franchiseLocationsApi.getActive();
      const results: any[] = [];

      for (const loc of locations) {
        const session = await cashSessionApi.findAnyOpenSession(String(loc._id));
        if (session && session.status === "open") {
          const openDate = new Date(session.openDateTime);
          const today = new Date();

          const isSameDay =
            openDate.getFullYear() === today.getFullYear() &&
            openDate.getMonth() === today.getMonth() &&
            openDate.getDate() === today.getDate();

          if (!isSameDay) {
            results.push({
              franchiseName: loc.name,
              franchiseId: loc._id,
              session,
            });
          }
        }
      }
      
      setPendingSessions(results);
    } catch (err) {
      console.error("Error cargando sesiones pendientes globales:", err);
    }
  }, [user]);


  useEffect(() => {
    getCurrentFranchise();
    loadPendingSessionsAllBranches();
  }, [user, loadPendingSessionsAllBranches]);

  // Cargar datos de ventas cuando se obtenga el ID de la franquicia
  useEffect(() => {
    if (franchiseId) {
      loadAnyOpenSession();
    }
  }, [franchiseId, loadAnyOpenSession]);

  // Función para validar números con hasta 2 decimales
  const handleNumericInput = (value: string, setter: (value: string) => void) => {
    // Permitir solo números, punto decimal y hasta 2 decimales
    const regex = /^\d*\.?\d{0,2}$/;
    if (value === '' || regex.test(value)) {
      setter(value);
    }
  };

  const handleCloseCash = async () => {
    if (!franchiseId) {
      alertError('No se pudo identificar la sucursal');
      return;
    }

    // Validar que todos los campos tengan valores válidos
    const feriaValue = parseFloat(feria) || 0;
    const tarjetaValue = parseFloat(tarjeta) || 0;
    const dolarValue = parseFloat(dolar) || 0;
    const salidaValue = parseFloat(salida) || 0;

    if (feriaValue < 0 || tarjetaValue < 0 || dolarValue < 0 || salidaValue < 0) {
      alertError('Los valores no pueden ser negativos');
      return;
    }

    try {
      setClosingCash(true);

      // Primero verificar que existe una sesión abierta para hoy
      const sessionStatus = await cashSessionApi.checkTodaySession(franchiseId);
      
      if (!sessionStatus.hasSession || !sessionStatus.session) {
        alertError('No existe una caja abierta para el día de hoy en esta sucursal');
        return;
      }

      // Preparar datos para el cierre
      const closeData = {
        closeDateTime: new Date().toISOString(),
        closing_cash_usd: dolarValue,
        closing_cash_mxn: feriaValue,
        card_amount: tarjetaValue,
        withdrawn_amount: salidaValue,
        status: 'closed' as const
      };

      // Cerrar la sesión
      await cashSessionApi.close(franchiseId, closeData);

      success('Caja cerrada exitosamente. Cerrando sesión...');
      
      // Limpiar formulario
      setFeria('');
      setTarjeta('');
      setDolar('');
      setSalida('');
      setCorte('');

      // Hacer logout automáticamente después de cerrar la caja
      setTimeout(() => {
        logout();
      }, 2000); // Esperar 2 segundos para que el usuario vea el mensaje

    } catch (error: any) {
      alertError(error.message || 'Error al cerrar la caja');
    } finally {
      setClosingCash(false);
    }
  };

  const handleForceClose = async (sessionId: string) => {
    try {
      setClosingCash(true);

      await cashSessionApi.forceClose(sessionId, {
        closing_cash_mxn: parseFloat(feria) || 0,
        closing_cash_usd: parseFloat(dolar) || 0,
        card_amount: parseFloat(tarjeta) || 0,
        withdrawn_amount: parseFloat(salida) || 0,
        notes: "Cierre forzado por administrador",
      });

      success("Sesión atrasada cerrada correctamente.");

      loadPendingSessionsAllBranches();
    } catch (err: any) {
      alertError(
        err?.response?.data?.error || "Error al cerrar la sesión atrasada"
      );
    } finally {
      setClosingCash(false);
    }
  };  

  return (
    <Page>
      <Navigation />
      
      <Container>
        <Box>
          {loading ? (
            <Text>Cargando...</Text>
          ) : error ? (
            <Box bg="red.50" border="1px" borderColor="red.200" p={4} rounded="md" mb={6}>
              <Text color="red.600" fontWeight="medium">
                {error}
              </Text>
            </Box>
          ) : (
            <Box bg="white" p={6} rounded="lg" shadow="sm" border="1px" borderColor="gray.200" mb={6}>
                <Text fontSize="lg" fontWeight="medium" mb={4}>
                Sucursal Actual:
                </Text>
                {pendingSessions.length > 0 && (
                  <Box
                    bg="yellow.100"
                    border="1px"
                    borderColor="yellow.300"
                    p={4}
                    rounded="md"
                    mb={6}
                  >
                    <Text fontWeight="bold" color="yellow.800">
                      ⚠️ Existen sesiones de caja abiertas de días anteriores
                    </Text>

                    {pendingSessions.map((item, idx) => (
                      <Box
                        key={idx}
                        mb={3}
                        p={3}
                        bg="yellow.50"
                        rounded="md"
                        border="1px"
                        borderColor="yellow.200"
                      >
                        <Text color="yellow.800" fontWeight="bold">
                          • {item.franchiseName}
                        </Text>

                        <Text color="yellow.700">
                          Apertura: {new Date(item.session.openDateTime).toLocaleString()}
                        </Text>

                        <Button
                          mt={2}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleForceClose(item.session._id)}
                          isLoading={closingCash}
                        >
                          Cerrar Sesión Atrasada
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}

                {oldOpenSession && (
                  <Box
                    bg="blue.50"
                    border="1px"
                    borderColor="blue.300"
                    p={4}
                    rounded="md"
                    mb={6}
                  >
                    <Text fontWeight="bold" color="blue.800">
                      Sesión de caja abierta hoy
                    </Text>

                    <Text color="blue.700" mt={1}>
                      Apertura: {new Date(oldOpenSession.openDateTime).toLocaleString()}
                    </Text>

                    <Text color="blue.600" fontSize="sm" mt={1}>
                      Esta sesión corresponde al día actual
                    </Text>

                    <Button
                      mt={3}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleForceClose(oldOpenSession._id)}
                      isLoading={closingCash}
                    >
                      Cerrar Sesión Forzadamente
                    </Button>  
                  </Box>
                )}    

                <Flex direction="row" justifyContent={'space-between'} mb={4}>
                    <Text fontSize="xl" color="blue.600" fontWeight="semibold">
                        {franchiseName}
                    </Text>
                    <Box>
                        <Text fontSize="md" fontWeight="semibold" color="gray.800">
                        {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.username || 'Usuario'}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                        ({user?.username})
                        </Text>
                    </Box>
                </Flex>
                
                {/* Header con botón de actualizar */}
                <Flex justify="space-between" align="center" mt={6} mb={4}>
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline"
                    onClick={loadTodaysSalesData}
                    disabled={loadingSalesData || !franchiseId}
                    loading={loadingSalesData}
                  >
                    {loadingSalesData ? 'Actualizando...' : '🔄 Actualizar Datos'}
                  </Button>
                </Flex>
                
                {loadingSalesData && (
                  <Box textAlign="center" py={4}>
                    <Text color="blue.500" fontSize="sm">
                      Calculando montos del día...
                    </Text>
                  </Box>
                )}

                {exchangeRate !== 1 && (
                  <Box bg="blue.50" p={3} rounded="md" border="1px" borderColor="blue.200" mb={4}>
                    <Text fontSize="sm" color="blue.700">
                      Tipo de cambio USD → MXN: <strong>${exchangeRate.toFixed(2)}</strong>
                    </Text>
                  </Box>
                )}
                
                {/* Resumen de Gastos del Día */}
                {dailyExpenses.length > 0 && (
                  <Box bg="orange.50" p={4} rounded="md" border="1px" borderColor="orange.200" mb={4}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="md" fontWeight="semibold" color="orange.800">
                        Gastos del Día
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="orange.700">
                        ${totalExpenses.toFixed(2)} MXN
                      </Text>
                    </Flex>
                    <Box my={2} borderBottom="1px" borderColor="orange.300" />
                    <VStack align="stretch" gap={1} maxH="150px" overflowY="auto">
                      {dailyExpenses.map((expense, idx) => (
                        <Flex key={idx} justify="space-between" fontSize="sm" color="gray.700">
                          <Text>{expense.reason}</Text>
                          <Text fontWeight="medium">${expense.amount.toFixed(2)}</Text>
                        </Flex>
                      ))}
                    </VStack>
                    <Text fontSize="xs" color="orange.600" mt={2} fontStyle="italic">
                      Los gastos se restan del efectivo final al cerrar la caja
                    </Text>
                  </Box>
                )}
                
                {/* Resumen de Cálculo de Efectivo */}
                {dailyExpenses.length > 0 && parseFloat(feria) > 0 && (
                  <Box bg="blue.50" p={4} rounded="md" border="1px" borderColor="blue.200" mb={4}>
                    <Text fontSize="md" fontWeight="semibold" color="blue.800" mb={2}>
                      💵 Cálculo de Efectivo Final
                    </Text>
                    <VStack align="stretch" gap={1} fontSize="sm">
                      <Flex justify="space-between" color="gray.700">
                        <Text>Efectivo de ventas:</Text>
                        <Text fontWeight="medium">+${(parseFloat(feria) + totalExpenses).toFixed(2)}</Text>
                      </Flex>
                      <Flex justify="space-between" color="orange.700">
                        <Text>Gastos del día:</Text>
                        <Text fontWeight="medium">-${totalExpenses.toFixed(2)}</Text>
                      </Flex>
                      <Box my={1} borderBottom="1px" borderColor="blue.300" />
                      <Flex justify="space-between" color="blue.800" fontWeight="bold">
                        <Text>Efectivo esperado en caja:</Text>
                        <Text>=  ${parseFloat(feria).toFixed(2)}</Text>
                      </Flex>
                    </VStack>
                  </Box>
                )}
                
                {/* Inputs para cierre de caja */}
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        Corte Total (MXN):
                      </Text>
                    </Flex>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={corte}
                      onChange={(e) => handleNumericInput(e.target.value, setCorte)}
                      bg={corte ? "green.50" : "white"}
                      borderColor={corte ? "green.200" : "gray.200"}
                    />
                  </Box>
                  
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        Efectivo Final (MXN):
                      </Text>
                      {dailyExpenses.length > 0 && (
                        <Text fontSize="xs" color="gray.500" fontStyle="italic">
                          (ya con gastos restados)
                        </Text>
                      )}
                    </Flex>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={feria}
                      onChange={(e) => handleNumericInput(e.target.value, setFeria)}
                      bg={feria ? "green.50" : "white"}
                      borderColor={feria ? "green.200" : "gray.200"}
                    />
                  </Box>
                  
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        Tarjeta (MXN):
                      </Text>
                    </Flex>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={tarjeta}
                      onChange={(e) => handleNumericInput(e.target.value, setTarjeta)}
                      bg={tarjeta ? "green.50" : "white"}
                      borderColor={tarjeta ? "green.200" : "gray.200"}
                    />
                  </Box>
                  
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        Dólar (USD):
                      </Text>
                    </Flex>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={dolar}
                      onChange={(e) => handleNumericInput(e.target.value, setDolar)}
                      bg={dolar ? "green.50" : "white"}
                      borderColor={dolar ? "green.200" : "gray.200"}
                    />
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                      Salida:
                    </Text>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={salida}
                      onChange={(e) => handleNumericInput(e.target.value, setSalida)}
                    />
                  </Box>
                </SimpleGrid>
            </Box>
          )}

          <Flex justify="flex-end">
            <Button 
              colorScheme="red" 
              size="lg"
              onClick={handleCloseCash}
              disabled={loading || !!error || closingCash}
              loading={closingCash}
            >
              {closingCash ? 'Cerrando caja...' : 'Cerrar Caja'}
            </Button>
          </Flex>
        </Box>
      </Container>
    </Page>
  );
};

export default CashClose;