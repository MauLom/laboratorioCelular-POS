import React, { useState, useEffect, useCallback } from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
  Button,
  Text,
  chakra,
} from '@chakra-ui/react';
import Layout from '../components/common/Layout';
import Navigation from '../components/common/Navigation';
import SalesForm from '../components/sales/SalesForm';
import { salesApi } from '../services/api';
import { Sale, PaginatedResponse } from '../types';

// Use native HTML elements with Chakra styling
const Select = chakra('select');
const Table = chakra('table');
const Thead = chakra('thead');
const Tbody = chakra('tbody');
const Tr = chakra('tr');
const Th = chakra('th');
const Td = chakra('td');

const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({
    description: '',
    finance: '',
  });

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<Sale> = await salesApi.getAll(filters);
      setSales(response.sales || []);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      alert('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleAddSale = async (saleData: Omit<Sale, '_id' | 'createdAt' | 'updatedAt'>) => {
    setFormLoading(true);
    try {
      await salesApi.create(saleData);
      setShowForm(false);
      fetchSales();
      alert('¡Venta registrada exitosamente!');
    } catch (error) {
      console.error('Failed to record sale:', error);
      alert('Error al registrar la venta');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta venta?')) return;
    
    try {
      await salesApi.delete(id);
      fetchSales();
      alert('¡Venta eliminada exitosamente!');
    } catch (error) {
      console.error('Failed to delete sale:', error);
      alert('Error al eliminar la venta');
    }
  };

  const closeForm = () => {
    setShowForm(false);
  };

  if (loading) {
    return (
      <Layout title="Gestión de Ventas">
        <Navigation />
        <VStack gap={6} align="stretch">
          <Box bg="white" p={6} rounded="lg" shadow="md">
            <Heading size="lg" color="dark.400">
              Registros de Ventas
            </Heading>
          </Box>
          <Box bg="white" p={12} rounded="lg" shadow="md" textAlign="center">
            <Text fontSize="lg" color="gray.500">Cargando ventas...</Text>
          </Box>
        </VStack>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Ventas">
      <Navigation />
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box bg="white" p={6} rounded="lg" shadow="md">
          <HStack justify="space-between" align="center">
            <Heading size="lg" color="dark.400">
              Registros de Ventas
            </Heading>
            <Button colorScheme="green" onClick={() => setShowForm(true)}>
              Registrar Nueva Venta
            </Button>
          </HStack>
        </Box>

        {/* Filters */}
        <Box bg="white" p={4} rounded="lg" shadow="sm">
          <HStack gap={4} wrap="wrap">
            <Select
              value={filters.description}
              onChange={(e: any) => setFilters({ ...filters, description: e.target.value })}
              maxW="200px"
              p={2}
              border="1px solid"
              borderColor="gray.300"
              rounded="md"
              bg="white"
            >
              <option value="">Todas las Descripciones</option>
              <option value="Fair">Justo</option>
              <option value="Payment">Pago</option>
              <option value="Sale">Venta</option>
              <option value="Deposit">Depósito</option>
            </Select>
            
            <Select
              value={filters.finance}
              onChange={(e: any) => setFilters({ ...filters, finance: e.target.value })}
              maxW="250px"
              p={2}
              border="1px solid"
              borderColor="gray.300"
              rounded="md"
              bg="white"
            >
              <option value="">Todos los Tipos de Financiamiento</option>
              <option value="Payjoy">Payjoy</option>
              <option value="Lespago">Lespago</option>
              <option value="Repair">Reparación</option>
              <option value="Accessory">Accesorio</option>
              <option value="Cash">Efectivo</option>
              <option value="Other">Otro</option>
            </Select>
          </HStack>
        </Box>

        {/* Sales Table */}
        <Box bg="white" rounded="lg" shadow="md" overflow="hidden">
          <Table w="100%" borderCollapse="collapse">
            <Thead bg="green.500">
              <Tr>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600">Fecha</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600">Descripción</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600">Financiamiento</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600">Concepto</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600">IMEI</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600">Monto</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600">Cliente</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600">Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sales.length === 0 ? (
                <Tr>
                  <Td colSpan={8}>
                    <Box py={12} textAlign="center">
                      <Text fontSize="lg" color="gray.500">
                        No se encontraron registros de ventas
                      </Text>
                    </Box>
                  </Td>
                </Tr>
              ) : (
                sales.map((sale) => (
                  <Tr key={sale._id} _hover={{ bg: "gray.50" }} _even={{ bg: "gray.50" }}>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '-'}
                    </Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200">{sale.description}</Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200">{sale.finance}</Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200">{sale.concept}</Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200">{sale.imei || '-'}</Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" fontWeight="semibold">${sale.amount.toFixed(2)}</Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200">{sale.customerName || '-'}</Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200">
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={() => sale._id && handleDeleteSale(sale._id)}
                      >
                        Eliminar
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        {/* Simple Modal for Add Form */}
        {showForm && (
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="rgba(0, 0, 0, 0.5)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex="1000"
          >
            <Box
              bg="white"
              p={6}
              rounded="lg"
              maxW="90vw"
              maxH="90vh"
              overflowY="auto"
              position="relative"
              shadow="xl"
            >
              <Button
                position="absolute"
                top={4}
                right={4}
                variant="ghost"
                onClick={closeForm}
                fontSize="xl"
                p={1}
                minW="auto"
                h="auto"
              >
                ×
              </Button>
              <SalesForm
                onSubmit={handleAddSale}
                isLoading={formLoading}
              />
            </Box>
          </Box>
        )}
      </VStack>
    </Layout>
  );
};

export default SalesPage;