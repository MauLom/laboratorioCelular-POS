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

      // Filtrar ventas del día actual en el cliente como respaldo
      const today = new Date();
      
      const todaysSales = allSales.filter(sale => {
        if (!sale.createdAt) {
          console.log('❌ Venta sin createdAt:', sale.folio);
          return false;
        }
        
        const saleDate = new Date(sale.createdAt);
        
        // Comparar solo las fechas (año, mes, día) sin considerar la hora
        const saleDateOnly = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // También considerar las últimas 24 horas para manejar diferencias de zona horaria
        const last24Hours = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const next24Hours = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        
        const isToday = saleDateOnly.getTime() === todayOnly.getTime();
        const isWithin24Hours = saleDate >= last24Hours && saleDate <= next24Hours;
        
        // Aceptar si es del día actual O si está dentro de las últimas/próximas 24 horas
        const shouldInclude = isToday || isWithin24Hours;
        return shouldInclude;
      });
            
      // Calcular montos por tipo de pago
      let totalCard = 0;
      let totalUSD = 0;
      let totalCash = 0;
      let totalAmount = 0;

      todaysSales.forEach((sale, index) => {
        
        if (sale.paymentMethods && Array.isArray(sale.paymentMethods)) {
          sale.paymentMethods.forEach(payment => {
            const amount = payment.amount || 0;
            console.log(`💰 Método de pago: ${payment.type} - $${amount}`);
            
            switch (payment.type?.toLowerCase()) {
              case 'tarjeta':
              case 'card':
                totalCard += amount;
                break;
              case 'dolar':
              case 'usd':
              case 'dollar':
                totalUSD += amount;
                // Para el corte total, convertir dólares a pesos
                totalAmount += amount * currentExchangeRate;
                break;
              case 'efectivo':
              case 'cash':
                totalCash += amount;
                break;
              default:
                // Si no se especifica tipo, asumir que es efectivo
                totalCash += amount;
                console.log(`⚠️ Tipo de pago no reconocido: ${payment.type}, asignado a efectivo`);
                break;
            }
          });
        } else {
          // Si no hay paymentMethods, usar el amount total como efectivo
          const amount = sale.amount || 0;
          totalCash += amount;
        }
        
        // Sumar al total general (excepto USD que ya se convirtió arriba)
        if (!sale.paymentMethods || !sale.paymentMethods.some(p => 
          ['dolar', 'usd', 'dollar'].includes(p.type?.toLowerCase() || ''))) {
          totalAmount += sale.amount || 0;
        }
      });

      // Obtener gastos del día primero para poder ajustar el efectivo
      try {
        const today = new Date();
        const localDate = today.toLocaleDateString('en-CA', { timeZone: 'America/Monterrey' });
        const expenses = await listExpenses({ from: localDate, to: localDate });
        
        setDailyExpenses(expenses);
        
        // Calcular total de gastos
        const expensesTotal = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        setTotalExpenses(expensesTotal);
        
        console.log(`💸 Total de gastos del día: $${expensesTotal.toFixed(2)} (${expenses.length} gastos)`);
        
        // Establecer valores calculados DESPUÉS de obtener gastos
        // El efectivo final debe reflejar las ventas menos los gastos del día
        const adjustedCash = totalCash - expensesTotal;
        setCorte(totalAmount.toFixed(2));
        setFeria(adjustedCash.toFixed(2));
        setTarjeta(totalCard.toFixed(2));
        setDolar(totalUSD.toFixed(2));
        
        console.log(`💰 Efectivo de ventas: $${totalCash.toFixed(2)}`);
        console.log(`💸 Gastos del día: $${expensesTotal.toFixed(2)}`);
        console.log(`✅ Efectivo ajustado (ventas - gastos): $${adjustedCash.toFixed(2)}`);
      } catch (expError) {
        console.error('Error cargando gastos del día:', expError);
        // No fallar si no se pueden cargar los gastos
        setDailyExpenses([]);
        setTotalExpenses(0);
        
        // Si no se pueden cargar gastos, usar valores sin ajustar
        setCorte(totalAmount.toFixed(2));
        setFeria(totalCash.toFixed(2));
        setTarjeta(totalCard.toFixed(2));
        setDolar(totalUSD.toFixed(2));
      }

    } catch (error: any) {
      console.error('Error cargando datos de ventas del día:', error);
      alertError('Error al cargar los datos de ventas del día');
    } finally {
      setLoadingSalesData(false);
    }
  }, [franchiseId, alertError]);

  useEffect(() => {
    getCurrentFranchise();
  }, []);

  // Cargar datos de ventas cuando se obtenga el ID de la franquicia
  useEffect(() => {
    if (franchiseId) {
      loadTodaysSalesData();
    }
  }, [franchiseId, loadTodaysSalesData]);

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
      console.error('Error cerrando caja:', error);
      alertError(error.message || 'Error al cerrar la caja');
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