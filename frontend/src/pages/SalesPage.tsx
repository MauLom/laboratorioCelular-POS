import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import SalesForm from '../components/sales/SalesForm';
import { SalesArticle } from '../components/sales/SalesArticles';
import { salesApi } from '../services/api';
import { Sale, PaginatedResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../hooks/useAlert';
import styled from 'styled-components';

const Page = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const Container = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  overflow-y: hidden;
  
  @media (max-width: 1400px) {
    overflow-x: scroll;
  }
`;

// Type for printer from Windows service
interface Printer {
  name: string;
  isDefault: boolean;
}

// Use native HTML elements with Chakra styling
const Table = chakra('table');
const Thead = chakra('thead');
const Tbody = chakra('tbody');
const Tr = chakra('tr');
const Th = chakra('th');
const Td = chakra('td');

const SalesPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useAlert();
  const [sales, setSales] = useState<Sale[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  // const [franchiseLocations, setFranchiseLocations] = useState<FranchiseLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Articles state
  const [articles, setArticles] = useState<SalesArticle[]>([]);
  
  // Location lock reset state
  const [resetLocationLock, setResetLocationLock] = useState<boolean>(false);
  
  // Date range filters (keeping these as they're commonly needed)
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: '',
  });

  // Printer selection states
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [defaultPrinter, setDefaultPrinter] = useState<string>('');
  const [pendingSale, setPendingSale] = useState<Sale | null>(null);
  const [loadingPrinters, setLoadingPrinters] = useState(false);

  // Filter sales based on search term
  const filteredSales = useMemo(() => {
    if (!searchTerm.trim()) {
      return allSales;
    }

    const term = searchTerm.toLowerCase();
    return allSales.filter(sale => {
      // Search across all relevant fields
      const searchableFields = [
        sale.description?.toLowerCase() || '',
        sale.finance?.toLowerCase() || '',
        sale.concept?.toLowerCase() || '',
        sale.imei?.toLowerCase() || '',
        sale.customerName?.toLowerCase() || '',
        sale.amount?.toString() || '',
        // Include franchise location if it's an object
        typeof sale.franchiseLocation === 'object' && sale.franchiseLocation?.name
          ? `${sale.franchiseLocation.name} ${sale.franchiseLocation.code}`.toLowerCase()
          : '',
        // Include date
        sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '',
        // Include articles information for multi-article sales
        ...(sale.articles ? sale.articles.flatMap(article => [
          article.description?.toLowerCase() || '',
          article.concept?.toLowerCase() || '',
          article.finance?.toLowerCase() || '',
          article.imei?.toLowerCase() || '',
          article.reference?.toLowerCase() || ''
        ]) : [])
      ];

      return searchableFields.some(field => field.includes(term));
    });
  }, [allSales, searchTerm]);

  // Update sales display when filtered results change
  useEffect(() => {
    setSales(filteredSales);
  }, [filteredSales]);

  // Fetch franchise locations for Master admin
  const fetchFranchiseLocations = useCallback(async () => {
    if (user?.role === 'Master admin') {
      try {
        // const locations = await franchiseLocationsApi.getActive();
        // setFranchiseLocations(locations);
      } catch (error) {
        console.error('Failed to fetch franchise locations:', error);
      }
    }
  }, [user]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      // Only apply date filters on server-side for better performance
      const serverFilters = Object.fromEntries(
        Object.entries(dateFilters).filter(([_, value]) => value !== '')
      );
      const response: PaginatedResponse<Sale> = await salesApi.getAll(serverFilters);
      const salesData = response.sales || [];
      setAllSales(salesData);
      setSales(salesData);
    } catch (err) {
      console.error('Failed to fetch sales:', err);
      error('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  }, [dateFilters]);

  useEffect(() => {
    fetchFranchiseLocations();
  }, [fetchFranchiseLocations]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Load default printer from localStorage
  useEffect(() => {
    const savedPrinter = localStorage.getItem('defaultPrinter');
    if (savedPrinter) {
      setDefaultPrinter(savedPrinter);
    }
  }, []);

  // Fetch available printers
  const fetchAvailablePrinters = async () => {
    setLoadingPrinters(true);
    try {
      const winServiceUrl = process.env.REACT_APP_WIN_SERVICE_URL || 'http://localhost:5005';

      // Crear controlador para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${winServiceUrl}/api/printer/list`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const printers = data.printers || [];
        setAvailablePrinters(printers);

        // Si hay una impresora marcada como default y no tenemos una predeterminada, usarla
        const defaultPrinterFromAPI = printers.find((p: Printer) => p.isDefault);
        if (defaultPrinterFromAPI && !defaultPrinter) {
          setDefaultPrinter(defaultPrinterFromAPI.name);
        }

        return printers;
      } else {
        throw new Error('Failed to fetch printers');
      }
    } catch (err: any) {
      console.error('Failed to fetch printers:', err);

      let errorMsg = 'No se pudieron cargar las impresoras disponibles';

      if (err.name === 'AbortError') {
        errorMsg = 'Timeout: la carga de impresoras tardó demasiado (3s)';
      } else if (err.message.includes('Failed to fetch') || err.code === 'ECONNREFUSED') {
        errorMsg = 'Servicio de impresión no disponible. Verifica que esté ejecutándose en el puerto 5005.';
      }

      error(errorMsg);
      return [];
    } finally {
      setLoadingPrinters(false);
    }
  };

  // Save selected printer as default
  const saveDefaultPrinter = (printerName: string) => {
    setDefaultPrinter(printerName);
    localStorage.setItem('defaultPrinter', printerName);
    success(`Impresora "${printerName}" establecida como predeterminada`);
  };

  const handleExportToExcel = async () => {
    setExportLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(dateFilters).filter(([_, value]) => value !== '')
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

      if (searchTerm) filename += `_busqueda-${searchTerm.substring(0, 10)}`;
      if (dateFilters.startDate || dateFilters.endDate) {
        const dateRange = `${dateFilters.startDate || 'inicio'}_${dateFilters.endDate || 'fin'}`;
        filename += `_${dateRange}`;
      }
      filename += '.xlsx';

      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success('Archivo Excel generado exitosamente');
    } catch (err) {
      console.error('Failed to export sales:', err);
      error('Error al exportar las ventas a Excel');
    } finally {
      setExportLoading(false);
    }
  };

  const handleAddSale = async (saleData: Omit<Sale, '_id' | 'createdAt' | 'updatedAt'>) => {
    setFormLoading(true);
    try {
      const newSale = await salesApi.create(saleData);
      setShowForm(false);
      setArticles([]); // Limpiar artículos después de crear la venta
      fetchSales();
      success('¡Venta registrada exitosamente!');

      // Imprimir ticket con selección de impresora
      await handlePrintWithPrinterSelection(newSale);
    } catch (err) {
      console.error('Failed to record sale:', err);
      error('Error al registrar la venta');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddArticle = (article: SalesArticle) => {
    setArticles(prev => [...prev, article]);
    success('Artículo agregado a la venta');
  };

  const handleDeleteArticle = (id: string) => {
    setArticles(prev => prev.filter(article => article.id !== id));
    success('Artículo eliminado de la venta');
  };

  const printTicket = async (sale: Sale, printerName?: string) => {
    try {
      const winServiceUrl = process.env.REACT_APP_WIN_SERVICE_URL || 'http://localhost:5005';

      // Preparar datos para el ticket con la nueva estructura
      const saleDate = sale.createdAt ? new Date(sale.createdAt) : new Date();

      // Obtener información de la sucursal (franchiseLocation)
      const franchiseLocation = typeof sale.franchiseLocation === 'object' && sale.franchiseLocation
        ? sale.franchiseLocation
        : null;

      // Construir la dirección completa
      let address = "Dirección no disponible";
      if (franchiseLocation?.address) {
        const streetPart = franchiseLocation.address.street || '';
        const cityPart = franchiseLocation.address.city || '';
        const combinedAddress = `${streetPart} ${cityPart}`.trim();
        if (combinedAddress) {
          address = combinedAddress;
        }
      }

      // Obtener teléfono de la sucursal
      const phone = franchiseLocation?.contact?.phone || "(000) 000-0000";

      // Crear productos basado en los artículos de la venta
      let products = [];
      
      if (sale.articles && sale.articles.length > 0) {
        // Venta multi-artículo: usar cada artículo como producto
        products = sale.articles.map(article => ({
          name: `${article.description}${article.imei ? ` - IMEI: ${article.imei}` : ''}`,
          quantity: article.quantity,
          price: article.amount
        }));
      } else {
        // Venta simple: usar la información principal
        const productName = `${sale.concept}${sale.imei ? ` - IMEI: ${sale.imei}` : ''}`;
        products = [{
          name: productName,
          quantity: 1,
          price: sale.amount || 0
        }];
      }

      const ticketData = {
        address: address,
        phone: phone,
        seller: user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : user?.username || "Vendedor",
        folio: (sale.folio?.toString()) || "N/A",
        products: products,
        paymentAmount: sale.paymentAmount || sale.amount || 0,
        // Incluir impresora si se especificó
        ...(printerName && { printerName: printerName })
      };

      // Crear controlador para timeout personalizado
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${winServiceUrl}/api/printer/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error en impresión: ${response.status}`);
      }

      success('¡Ticket enviado a impresora!');
    } catch (err: any) {
      console.error('Failed to print ticket:', err);

      let errorMsg = 'No se pudo imprimir el ticket, pero la venta se registró correctamente';

      if (err.name === 'AbortError') {
        errorMsg = 'Timeout al enviar ticket a impresora (5s), pero la venta se registró correctamente';
      } else if (err.message.includes('Failed to fetch') || err.code === 'ECONNREFUSED') {
        errorMsg = 'Servicio de impresión no disponible. La venta se registró correctamente.';
      } else if (err.message.includes('Error en impresión')) {
        errorMsg = `Error en impresión: ${err.message}. La venta se registró correctamente.`;
      }

      error(errorMsg);
    }
  };

  // Handle printer selection and printing
  const handlePrintWithPrinterSelection = async (sale: Sale) => {
    // Si ya hay una impresora por defecto, úsala directamente
    if (defaultPrinter) {
      try {
        await printTicket(sale, defaultPrinter);
        return;
      } catch (err) {
        console.error('Failed to print with default printer:', err);
        // Si falla, mostrar selección de impresora
      }
    }

    // Cargar impresoras disponibles y mostrar modal
    const printers = await fetchAvailablePrinters();
    if (printers.length === 0) {
      error('No se encontraron impresoras disponibles');
      return;
    }

    // Si solo hay una impresora, úsala directamente
    if (printers.length === 1) {
      const printerName = printers[0].name;
      saveDefaultPrinter(printerName);
      await printTicket(sale, printerName);
      return;
    }

    // Mostrar modal de selección
    setPendingSale(sale);

    // Pre-seleccionar la impresora predeterminada de la aplicación, 
    // o la predeterminada del sistema si no hay ninguna configurada
    let preSelected = defaultPrinter;
    if (!preSelected) {
      const systemDefault = printers.find((p: Printer) => p.isDefault);
      if (systemDefault) {
        preSelected = systemDefault.name;
      }
    }

    setSelectedPrinter(preSelected || '');
    setShowPrinterModal(true);
  };

  const handleReprintTicket = async (sale: Sale) => {
    await handlePrintWithPrinterSelection(sale);
  };

  // Handle printer selection from modal
  const handlePrinterSelection = async () => {
    if (!selectedPrinter) return;

    try {
      saveDefaultPrinter(selectedPrinter);

      // Si hay una venta pendiente, imprimirla
      if (pendingSale) {
        await printTicket(pendingSale, selectedPrinter);
      }

      setShowPrinterModal(false);
      setPendingSale(null);
      setSelectedPrinter('');
    } catch (err) {
      console.error('Failed to print ticket:', err);
      error('Error al imprimir el ticket');
    }
  };

  const closePrinterModal = () => {
    setShowPrinterModal(false);
    setPendingSale(null);
    setSelectedPrinter('');
  };

  const handleDeleteSale = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta venta?')) return;

    try {
      await salesApi.delete(id);
      fetchSales();
      success('¡Venta eliminada exitosamente!');
    } catch (err) {
      console.error('Failed to delete sale:', err);
      error('Error al eliminar la venta');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setArticles([]); // Limpiar artículos al cerrar el formulario
    setResetLocationLock(true);
    // Resetear el flag después de un pequeño delay
    setTimeout(() => setResetLocationLock(false), 100);
  };

  if (loading) {


    return (
      <Page>
        <Navigation />
        <Container title="Gestión de Ventas">
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
        </Container>
      </Page>
    );
  }

  return (
    <Page>
      <Navigation />
      <Container title="Gestión de Ventas">
      <VStack gap={6} align="stretch" w="100%">
        {/* Header */}
        <Box bg="white" p={6} rounded="lg" shadow="md">
          <HStack justify="space-between" align="center">
            <Heading size="lg" color="dark.400">
              Registros de Ventas
            </Heading>
            <HStack gap={3}>
              <Button
                colorScheme="gray"
                variant="outline"
                onClick={async () => {
                  await fetchAvailablePrinters();
                  setShowPrinterModal(true);
                  setPendingSale(null); // No hay venta pendiente, solo cambio de impresora
                }}
                size="sm"
              >
                🖨️ {defaultPrinter ? `Impresora: ${defaultPrinter.substring(0, 15)}${defaultPrinter.length > 15 ? '...' : ''}` : 'Configurar Impresora'}
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleExportToExcel}
                disabled={exportLoading}
              >
                📊 {exportLoading ? 'Exportando...' : 'Exportar a Excel'}
              </Button>
              <Button colorScheme="green" onClick={() => { 
                setShowForm(true); 
                setArticles([]); 
                setResetLocationLock(true);
                // Resetear el flag después de un pequeño delay
                setTimeout(() => setResetLocationLock(false), 100);
              }}>
                Registrar Nueva Venta
              </Button>
            </HStack>
          </HStack>
        </Box>

          {/* Search and Filters */}
          <Box bg="white" p={4} rounded="lg" shadow="sm">
            <VStack gap={4} align="stretch">
              <Text fontSize="md" fontWeight="semibold" color="gray.700">
                Búsqueda y Filtros
              </Text>

              {/* Search Bar */}
              <HStack gap={4} wrap="wrap" align="center">
                <Box maxW="400px" position="relative">
                  <Input
                    placeholder="🔍 Buscar en todas las columnas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg="white"
                    borderColor="gray.300"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.6)"
                    }}
                  />
                </Box>

                {searchTerm && (
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => setSearchTerm('')}
                  >
                    Limpiar Búsqueda
                  </Button>
                )}

                <Text fontSize="sm" color="gray.500">
                  {sales.length} de {allSales.length} registros
                </Text>
              </HStack>

              {/* Date Filters Row */}
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
                    value={dateFilters.startDate}
                    onChange={(e) => setDateFilters({ ...dateFilters, startDate: e.target.value })}
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
                    value={dateFilters.endDate}
                    onChange={(e) => setDateFilters({ ...dateFilters, endDate: e.target.value })}
                    maxW="150px"
                    size="sm"
                  />
                </HStack>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="gray"
                  onClick={() => {
                    setDateFilters({ startDate: '', endDate: '' });
                    setSearchTerm('');
                  }}
                >
                  Limpiar Todo
                </Button>
              </HStack>
            </VStack>
          </Box>

        {/* Sales Table */}
        <TableContainer>
          <Table w="100%" borderCollapse="collapse" minW="1200px">
            <Thead bg="green.500">
              <Tr>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600" w="80px">Folio</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600" w="120px">Fecha</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600" w="120px">Descripción</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600" w="130px">Financiamiento</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600" w="150px">Concepto</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600" w="180px">IMEI</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600" w="100px">Monto</Th>
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600" w="120px">Cliente</Th>
                {user?.role === 'Master admin' && (
                  <Th color="white" py={4} px={4} textAlign="left" fontWeight="600" w="120px">Sucursal</Th>
                )}
                <Th color="white" py={4} px={4} textAlign="left" fontWeight="600" w="140px">Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sales.length === 0 ? (
                <Tr>
                  <Td colSpan={user?.role === 'Master admin' ? 10 : 9}>
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
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" fontWeight="semibold" color="blue.600" w="80px">
                      #{sale.folio || 'N/A'}
                    </Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" w="120px">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '-'}
                    </Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" w="120px">
                      {sale.description}
                      {sale.articles && sale.articles.length > 1 && (
                        <Text fontSize="xs" color="blue.500" fontWeight="semibold">
                          ({sale.articles.length} artículos)
                        </Text>
                      )}
                    </Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" w="130px">{sale.finance}</Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" w="150px">
                      {sale.articles && sale.articles.length > 1 
                        ? `Múltiples (${sale.articles.map(a => a.concept).join(', ')})`
                        : sale.concept
                      }
                    </Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" w="180px">
                      {sale.articles && sale.articles.length > 1
                        ? sale.articles.filter(a => a.imei).map(a => a.imei).join(', ') || '-'
                        : sale.imei || '-'
                      }
                    </Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" fontWeight="semibold" w="100px">${sale.amount.toFixed(2)}</Td>
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" w="120px">{sale.customerName || '-'}</Td>
                    {user?.role === 'Master admin' && (
                      <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" w="120px">
                        {typeof sale.franchiseLocation === 'object' && sale.franchiseLocation?.name 
                          ? `${sale.franchiseLocation.name} (${sale.franchiseLocation.code})` 
                          : '-'}
                      </Td>
                    )}
                    <Td py={4} px={4} borderTop="1px solid" borderColor="gray.200" w="140px">
                      <Box display="flex" gap={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleReprintTicket(sale)}
                        >
                          Reimprimir
                        </Button>
                        {user?.role === 'Master admin' && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => sale._id && handleDeleteSale(sale._id)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </Box>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>

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
              p={4}
            >
              <Box
                bg="white"
                p={2}
                w="fit-content"
                maxW="95vw"
                maxH="95vh"
                overflowY="auto"
                position="relative"
                borderRadius="8px"
                boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
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
                  articles={articles}
                  onAddArticle={handleAddArticle}
                  onDeleteArticle={handleDeleteArticle}
                  resetLocationLock={resetLocationLock}
                />
              </Box>
            </Box>
          )}

          {/* Printer Selection Modal */}
          {showPrinterModal && (
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
              zIndex="1100"
            >
              <Box
                bg="white"
                p={6}
                w="500px"
                maxW="90vw"
                position="relative"
              >
                <Button
                  position="absolute"
                  top={4}
                  right={4}
                  variant="ghost"
                  onClick={closePrinterModal}
                  fontSize="xl"
                  p={1}
                  minW="auto"
                  h="auto"
                >
                  ×
                </Button>

                <VStack gap={4} align="stretch">
                  <Box>
                    <Heading size="md" color="blue.600" mb={2}>
                      🖨️ Seleccionar Impresora
                    </Heading>
                    <Text fontSize="sm" color="gray.600">
                      La impresora seleccionada se establecerá como predeterminada para futuras impresiones.
                    </Text>
                  </Box>

                  {loadingPrinters ? (
                    <Box py={8} textAlign="center">
                      <Text color="gray.500">Cargando impresoras...</Text>
                    </Box>
                  ) : (
                    <VStack gap={3} align="stretch">
                      {availablePrinters.map((printer, index) => {
                        const printerName = printer.name;
                        return (
                          <Box
                            key={index}
                            p={3}
                            border="2px solid"
                            borderColor={selectedPrinter === printerName ? "blue.500" : "gray.200"}
                            rounded="md"
                            cursor="pointer"
                            bg={selectedPrinter === printerName ? "blue.50" : "white"}
                            onClick={() => setSelectedPrinter(printerName)}
                            _hover={{
                              borderColor: "blue.300",
                              bg: "blue.25"
                            }}
                          >
                            <HStack>
                              <Box
                                w="20px"
                                h="20px"
                                rounded="full"
                                border="2px solid"
                                borderColor={selectedPrinter === printerName ? "blue.500" : "gray.300"}
                                bg={selectedPrinter === printerName ? "blue.500" : "white"}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                {selectedPrinter === printerName && (
                                  <Box w="8px" h="8px" bg="white" rounded="full" />
                                )}
                              </Box>
                              <VStack align="start" gap={1}>
                                <HStack>
                                  <Text fontWeight="semibold" fontSize="md">
                                    {printerName}
                                  </Text>
                                  {printer.isDefault && (
                                    <Text fontSize="xs" color="green.500" fontWeight="semibold" bg="green.50" px={2} py={1} rounded="md">
                                      Default del Sistema
                                    </Text>
                                  )}
                                </HStack>
                                {defaultPrinter === printerName && (
                                  <Text fontSize="xs" color="blue.500" fontWeight="semibold">
                                    ✓ Impresora predeterminada de la aplicación
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}

                  <HStack justify="flex-end" pt={4}>
                    <Button variant="outline" onClick={closePrinterModal}>
                      Cancelar
                    </Button>
                    <Button
                      colorScheme="blue"
                      onClick={handlePrinterSelection}
                      disabled={!selectedPrinter || loadingPrinters}
                    >
                      {pendingSale ? 'Imprimir y Establecer como Predeterminada' : 'Establecer como Predeterminada'}
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          )}
        </VStack>
      </Container>
    </Page>
  );
};

export default SalesPage;