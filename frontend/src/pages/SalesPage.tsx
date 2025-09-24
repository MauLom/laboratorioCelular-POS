import React, { useState, useEffect, useCallback } from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
  Button,
  Text,
  chakra,
  Input,
} from '@chakra-ui/react';
import Layout from '../components/common/Layout';
import Navigation from '../components/common/Navigation';
import MultiSelect from '../components/common/MultiSelect';
import SalesForm from '../components/sales/SalesForm';
import { salesApi, franchiseLocationsApi } from '../services/api';
import { Sale, PaginatedResponse, FranchiseLocation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useConfiguration } from '../hooks/useConfigurations';

// Use native HTML elements with Chakra styling
const Select = chakra('select');
const Table = chakra('table');
const Thead = chakra('thead');
const Tbody = chakra('tbody');
const Tr = chakra('tr');
const Th = chakra('th');
const Td = chakra('td');

const SalesPage: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [franchiseLocations, setFranchiseLocations] = useState<FranchiseLocation[]>([]);
  
  // Load configurations for filters
  const { getLabels: getDescriptionLabels, loading: descriptionsLoading } = useConfiguration('sales_descriptions');
  const { getLabels: getFinanceLabels, loading: financeLoading } = useConfiguration('finance_types');
  
  const [filters, setFilters] = useState({
    description: [] as string[],
    finance: [] as string[],
    franchiseLocation: '',
    startDate: '',
    endDate: '',
  });

  // Fetch franchise locations for Master admin
  const fetchFranchiseLocations = useCallback(async () => {
    if (user?.role === 'Master admin') {
      try {
        const locations = await franchiseLocationsApi.getActive();
        setFranchiseLocations(locations);
      } catch (error) {
        console.error('Failed to fetch franchise locations:', error);
      }
    }
  }, [user]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => {
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          return value !== '';
        })
      );
      const response: PaginatedResponse<Sale> = await salesApi.getAll(cleanFilters);
      setSales(response.sales || []);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      alert('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFranchiseLocations();
  }, [fetchFranchiseLocations]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleExportToExcel = async () => {
    setExportLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => {
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          return value !== '';
        })
      );
      
      const blob = await salesApi.exportToExcel(cleanFilters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Generate filename based on current date and filters
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      let filename = `ventas_${dateStr}`;
      
      if (filters.description.length > 0) filename += `_desc-${filters.description.length}`;
      if (filters.finance.length > 0) filename += `_fin-${filters.finance.length}`;
      if (filters.startDate || filters.endDate) {
        const dateRange = `${filters.startDate || 'inicio'}_${filters.endDate || 'fin'}`;
        filename += `_${dateRange}`;
      }
      filename += '.xlsx';
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('Archivo Excel generado exitosamente');
    } catch (error) {
      console.error('Failed to export sales:', error);
      alert('Error al exportar las ventas a Excel');
    } finally {
      setExportLoading(false);
    }
  };

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
            <HStack gap={3}>
              <Button
                colorScheme="blue"
                onClick={handleExportToExcel}
                disabled={exportLoading}
              >
                📊 {exportLoading ? 'Exportando...' : 'Exportar a Excel'}
              </Button>
              <Button colorScheme="green" onClick={() => setShowForm(true)}>
                Registrar Nueva Venta
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Filters */}
        <Box bg="white" p={4} rounded="lg" shadow="sm">
          <VStack gap={4} align="stretch">
            <Text fontSize="md" fontWeight="semibold" color="gray.700">
              Filtros de Búsqueda
            </Text>
            
            {/* First Row - Description and Finance */}
            <HStack gap={4} wrap="wrap">
              <MultiSelect
                options={getDescriptionLabels()}
                selectedValues={filters.description}
                onChange={(values) => setFilters({ ...filters, description: values })}
                placeholder="Todas las Descripciones"
                maxW="200px"
                isLoading={descriptionsLoading}
                loadingText="Cargando..."
              />
              
              <MultiSelect
                options={getFinanceLabels()}
                selectedValues={filters.finance}
                onChange={(values) => setFilters({ ...filters, finance: values })}
                placeholder="Todos los Tipos de Financiamiento"
                maxW="250px"
                isLoading={financeLoading}
                loadingText="Cargando..."
              />

              {/* Franchise Location Filter - Only for Master admin */}
              {user?.role === 'Master admin' && franchiseLocations.length > 0 && (
                <Select
                  value={filters.franchiseLocation}
                  onChange={(e: any) => setFilters({ ...filters, franchiseLocation: e.target.value })}
                  maxW="250px"
                  p={2}
                  border="1px solid"
                  borderColor="gray.300"
                  rounded="md"
                  bg="white"
                >
                  <option value="">Todas las Sucursales</option>
                  {franchiseLocations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.name} ({location.code})
                    </option>
                  ))}
                </Select>
              )}
            </HStack>

            {/* Second Row - Date Filters */}
            <HStack gap={4} wrap="wrap" align="center">
              <Text fontSize="sm" color="gray.600" minW="fit-content">
                Rango de Fechas:
              </Text>
              <HStack gap={2} align="center">
                <Text fontSize="sm" color="gray.600">
                  Desde:
                </Text>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  maxW="150px"
                  size="sm"
                />
              </HStack>
              <HStack gap={2} align="center">
                <Text fontSize="sm" color="gray.600">
                  Hasta:
                </Text>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  maxW="150px"
                  size="sm"
                />
              </HStack>
              <Button
                size="sm"
                variant="outline"
                colorScheme="gray"
                onClick={() => setFilters({
                  description: [],
                  finance: [],
                  franchiseLocation: '',
                  startDate: '',
                  endDate: '',
                })}
              >
                Limpiar Filtros
              </Button>
            </HStack>
          </VStack>
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
                {user?.role === 'Master admin' && (
                  <Th color="white" py={4} px={4} textAlign="left" fontWeight="600">Sucursal</Th>
                )}
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600">Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sales.length === 0 ? (
                <Tr>
                  <Td colSpan={user?.role === 'Master admin' ? 9 : 8}>
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
                    {user?.role === 'Master admin' && (
                      <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200">
                        {typeof sale.franchiseLocation === 'object' && sale.franchiseLocation?.name 
                          ? `${sale.franchiseLocation.name} (${sale.franchiseLocation.code})` 
                          : '-'}
                      </Td>
                    )}
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