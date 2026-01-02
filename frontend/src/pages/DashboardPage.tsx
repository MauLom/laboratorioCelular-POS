import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  VStack,
  SimpleGrid,
  Text,
  Heading,
  Button,
  Flex,
  Skeleton,
  SkeletonText,
  Box,
} from '@chakra-ui/react';
import Navigation from '../components/common/Navigation';
import { inventoryApi, salesApi } from '../services/api';
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

interface InventoryStats {
  stateStats: Array<{ _id: string; count: number }>;
  branchStats: Array<{ _id: string; count: number }>;
}

interface SalesStats {
  descriptionStats: Array<{ _id: string; count: number; totalAmount: number }>;
  financeStats: Array<{ _id: string; count: number; totalAmount: number }>;
}

const DashboardPage: React.FC = () => {
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [invStats, saleStats] = await Promise.all([
          inventoryApi.getStats(),
          salesApi.getStats(),
        ]);

        setInventoryStats(invStats);
        setSalesStats(saleStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getTotalInventoryItems = () => {
    if (!inventoryStats?.stateStats) return 0;
    return inventoryStats.stateStats.reduce((total, stat) => total + stat.count, 0);
  };

  const getTotalSalesAmount = () => {
    if (!salesStats?.descriptionStats) return 0;
    return salesStats.descriptionStats.reduce((total, stat) => total + stat.totalAmount, 0);
  };

  const getAvailableItems = () => {
    if (!inventoryStats?.stateStats) return 0;
    const availableStates = ['New', 'Repaired'];
    return inventoryStats.stateStats
      .filter(stat => availableStates.includes(stat._id))
      .reduce((total, stat) => total + stat.count, 0);
  };

  const [showAvailableModal, setShowAvailableModal] = useState(false);

  return (
    <Page>
      <Navigation />

      <Container title="Panel de Control">
        <VStack gap={8} align="stretch">
          {/* Stats Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={6}>
            {loading ? (
              <>
                {[...Array(4)].map((_, index) => (
                  <Box key={index} bg="white" p={8} rounded="lg" shadow="md" textAlign="center">
                    <Skeleton height="3rem" mb={3} />
                    <SkeletonText noOfLines={1} />
                  </Box>
                ))}
              </>
            ) : (
              <>
                <Box bg="white" p={8} rounded="lg" shadow="md" textAlign="center">
                  <Text fontSize="3xl" color="dark.400" fontWeight="bold" mb={2}>
                    {getTotalInventoryItems()}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                    Total de Artículos
                  </Text>
                </Box>

                <Box bg="white" p={8} rounded="lg" shadow="md" textAlign="center">
                  <Text fontSize="3xl" color="dark.400" fontWeight="bold" mb={2}>
                    {getAvailableItems()}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                    Artículos Disponibles
                  </Text>
                   
                  <Button
                    size="sm"
                    mt={3}
                    colorScheme="blue"
                    onClick={() => setShowAvailableModal(true)}
                  >
                    Ver Detalles
                  </Button>
                </Box>      

                <Box bg="white" p={8} rounded="lg" shadow="md" textAlign="center">
                  <Text fontSize="3xl" color="dark.400" fontWeight="bold" mb={2}>
                    {salesStats?.descriptionStats?.length || 0}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                    Total de Ventas
                  </Text>
                </Box>
              </>
            )}
          </SimpleGrid>

          {/* Quick Actions */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
            <Box bg="white" p={8} rounded="lg" shadow="md" textAlign="center">
              <Heading size="md" color="dark.400" mb={4}>
                Gestión de Inventario
              </Heading>
              <Text color="gray.600" mb={6}>
                Agregar, editar y gestionar su inventario de celulares con diferentes estados y seguimiento.
              </Text>
              <RouterLink to="/inventory" style={{ textDecoration: 'none' }}>
                <Button
                  colorScheme="blue"
                  size="lg"
                  fontWeight="semibold"
                  width="100%"
                >
                  Gestionar Inventario
                </Button>
              </RouterLink>
            </Box>

            <Box bg="white" p={8} rounded="lg" shadow="md" textAlign="center">
              <Heading size="md" color="dark.400" mb={4}>
                Gestión de Ventas
              </Heading>
              <Text color="gray.600" mb={6}>
                Registrar transacciones de venta con información detallada y seguimiento de pagos.
              </Text>
              <RouterLink to="/sales" style={{ textDecoration: 'none' }}>
                <Button
                  colorScheme="green"
                  size="lg"
                  fontWeight="semibold"
                  width="100%"
                >
                  Registrar Ventas
                </Button>
              </RouterLink>
            </Box>
          </SimpleGrid>

          {/* Inventory by State */}
          {inventoryStats && (
            <Box bg="white" p={6} rounded="lg" shadow="md">
              <Heading size="md" color="dark.400" mb={4}>
                Inventario por Estado
              </Heading>
              <VStack gap={3} align="stretch">
                {inventoryStats.stateStats.map(stat => (
                  <Flex key={stat._id} justify="space-between" align="center" py={2}>
                    <Text color="gray.700">{stat._id}:</Text>
                    <Text fontWeight="bold" color="dark.400">{stat.count}</Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          )}

          {showAvailableModal && (
            <Box
             position="fixed"
             top="0"
             left="0"
             right="0"
             bottom="0"
             bg="rgba(0,0,0,0.5)"
             display="flex"
             alignItems="center"
             justifyContent="center"
             zIndex="1000"
            >
              <Box
                bg="white"
                p={8}
                rounded="lg"
                shadow="xl"
                minW="400px"
                maxH="80vh"
                overflowY="auto"
                position="relative"
            >
              <Button
                position="absolute"
                top={2}
                right={2}
                size="sm"
                variant="ghost"
                onClick={() => setShowAvailableModal(false)}
              >
                ✕
              </Button>

              <Heading size="md" mb={4} color="dark.400">
                Equipos disponibles por sucursal
              </Heading>

              {inventoryStats?.branchStats?.map((s) => (
                <Flex
                  key={s._id}
                  justify="space-between"
                  align="center"
                  py={2}
                  borderBottom="1px solid #eee"
                >
                  <Text fontWeight="semibold">{s._id}</Text>
                  <Text color="blue.600" fontWeight="bold">
                    {s.count}
                  </Text>
                </Flex>
              ))}

              <Text fontWeight="bold" mt={4} fontSize="md">
                TOTAL DISPONIBLES: {getAvailableItems()}
              </Text>
            </Box>
          </Box>
        )}

        
        </VStack>
      </Container>
    </Page>

  );
};

export default DashboardPage;