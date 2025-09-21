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
import Layout from '../components/common/Layout';
import Navigation from '../components/common/Navigation';
import { inventoryApi, salesApi } from '../services/api';

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

  return (
    <Layout title="Panel de Control">
      <Navigation />
      <VStack gap={8} align="stretch">
        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={6}>
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
              </Box>

              <Box bg="white" p={8} rounded="lg" shadow="md" textAlign="center">
                <Text fontSize="3xl" color="dark.400" fontWeight="bold" mb={2}>
                  {salesStats?.descriptionStats?.length || 0}
                </Text>
                <Text fontSize="sm" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                  Total de Ventas
                </Text>
              </Box>

              <Box bg="white" p={8} rounded="lg" shadow="md" textAlign="center">
                <Text fontSize="3xl" color="dark.400" fontWeight="bold" mb={2}>
                  ${getTotalSalesAmount().toFixed(2)}
                </Text>
                <Text fontSize="sm" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                  Ingresos por Ventas
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
      </VStack>
    </Layout>
  );
};

export default DashboardPage;