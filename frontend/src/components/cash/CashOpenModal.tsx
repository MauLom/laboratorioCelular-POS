import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text
} from '@chakra-ui/react';
import { cashSessionApi } from '../../services/api';
import { CashSessionOpenRequest } from '../../types';
import { useAlert } from '../../hooks/useAlert';

interface CashOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  franchiseName: string;
  franchiseId: string;
  isValidFranchise?: boolean;
  onSuccess: () => void;
}

const CashOpenModal: React.FC<CashOpenModalProps> = ({
  isOpen,
  onClose,
  franchiseName,
  franchiseId,
  isValidFranchise = true,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const { success, error: alertError } = useAlert();
  const [formData, setFormData] = useState({
    opening_cash_mxn: '',
    opening_cash_usd: '',
    exchange_rate_usd_mxn: '20.00'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Solo permitir números y punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidFranchise) {
      alertError('No se puede abrir la caja sin una franquicia válida');
      return;
    }
    
    const { opening_cash_mxn, opening_cash_usd, exchange_rate_usd_mxn } = formData;
    
    if (!opening_cash_mxn || !opening_cash_usd || !exchange_rate_usd_mxn) {
      alertError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);

    try {
      const requestData: CashSessionOpenRequest = {
        franchiseLocationId: franchiseId,
        opening_cash_mxn: parseFloat(opening_cash_mxn),
        opening_cash_usd: parseFloat(opening_cash_usd),
        exchange_rate_usd_mxn: parseFloat(exchange_rate_usd_mxn)
      };

      console.log('💰 Opening cash session with data:', requestData);
      await cashSessionApi.open(requestData);
      console.log('✅ Cash session opened successfully');
      success('Caja abierta exitosamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('💥 Error opening cash session:', error);
      console.error('💥 Error response:', error.response?.data);
      alertError(error.response?.data?.error || 'Error al abrir la caja');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100%"
      height="100%"
      backgroundColor="rgba(0, 0, 0, 0.5)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
    >
      <Box
        backgroundColor="white"
        borderRadius="8px"
        padding="24px"
        maxWidth="400px"
        width="90%"
        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
      >
        <Text fontSize="xl" fontWeight="bold" mb={4} textAlign="center">
          Abrir Caja
        </Text>
        
        <Text 
          fontSize="md" 
          color={isValidFranchise ? "blue.600" : "red.500"} 
          mb={4} 
          textAlign="center"
        >
          {franchiseName}
        </Text>

        {!isValidFranchise && (
          <Text fontSize="sm" color="red.500" mb={6} textAlign="center" bg="red.50" p={3} borderRadius="md">
            No se puede abrir la caja sin una franquicia válida. 
            Verifique que el servicio de sistema esté disponible y que esta máquina esté registrada en una franquicia.
          </Text>
        )}

        <form onSubmit={handleSubmit}>
          <VStack gap={4}>
            <Box width="100%">
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Efectivo MXN *
              </Text>
              <Input
                name="opening_cash_mxn"
                type="text"
                value={formData.opening_cash_mxn}
                onChange={handleInputChange}
                placeholder="0.00"
                required
                disabled={!isValidFranchise}
              />
            </Box>

            <Box width="100%">
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Efectivo USD *
              </Text>
              <Input
                name="opening_cash_usd"
                type="text"
                value={formData.opening_cash_usd}
                onChange={handleInputChange}
                placeholder="0.00"
                required
                disabled={!isValidFranchise}
              />
            </Box>

            <Box width="100%">
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Tipo de Cambio USD/MXN *
              </Text>
              <Input
                name="exchange_rate_usd_mxn"
                type="text"
                value={formData.exchange_rate_usd_mxn}
                onChange={handleInputChange}
                placeholder="20.00"
                required
                disabled={!isValidFranchise}
              />
            </Box>

            <HStack gap={3} width="100%" justify="flex-end" mt={6}>
              {/* <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cancelar
              </Button> */}
              <Button
                type="submit"
                colorScheme="blue"
                disabled={loading || !isValidFranchise}
              >
                {loading ? 'Abriendo...' : !isValidFranchise ? 'Franquicia No Válida' : 'Abrir Caja'}
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>
    </Box>
  );
};

export default CashOpenModal;