import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Button, Flex, Input, SimpleGrid } from '@chakra-ui/react';
import Navigation from '../common/Navigation';
import { franchiseLocationsApi, cashSessionApi } from '../../services/api';
import { deviceTrackerApi } from '../../services/deviceTrackerApi';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../hooks/useAlert';
import styled from 'styled-components';

const Page = styled.div`
  min-height: 100vh;
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
  
  // Estados para los campos de cierre de caja
  const [corte, setCorte] = useState('');
  const [feria, setFeria] = useState('');
  const [tarjeta, setTarjeta] = useState('');
  const [dolar, setDolar] = useState('');
  const [salida, setSalida] = useState('');

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

  useEffect(() => {
    getCurrentFranchise();
  }, []);

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
                
                {/* Inputs para cierre de caja */}
                <SimpleGrid columns={2} mt={6} gap={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                      Corte:
                    </Text>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={corte}
                      onChange={(e) => handleNumericInput(e.target.value, setCorte)}
                    />
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                      Feria:
                    </Text>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={feria}
                      onChange={(e) => handleNumericInput(e.target.value, setFeria)}
                    />
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                      Tarjeta:
                    </Text>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={tarjeta}
                      onChange={(e) => handleNumericInput(e.target.value, setTarjeta)}
                    />
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                      Dólar:
                    </Text>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={dolar}
                      onChange={(e) => handleNumericInput(e.target.value, setDolar)}
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