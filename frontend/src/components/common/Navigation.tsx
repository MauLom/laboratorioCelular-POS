import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, HStack, chakra, Text, Button } from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';

const ChakraLink = chakra(RouterLink);

const Navigation: React.FC = () => {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();           // 👈 usamos isAdmin()
  const role = user?.role || 'Cajero';
  const isCashier = role === 'Cajero';

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  // Corte del día visible para Cajero y Admin/Supervisores
  const showDaily = isAdmin() || isCashier;

  return (
    <Box bg="dark.500" py={4} px={8} shadow="sm">
      <HStack justify="space-between">
        <HStack gap={8}>
          <ChakraLink
            to="/"
            color="gray.100"
            px={4}
            py={2}
            rounded="md"
            transition="all 0.2s"
            bg={isActive('/') ? 'brand.400' : 'transparent'}
            _hover={{ bg: isActive('/') ? 'brand.500' : 'dark.400' }}
            fontWeight="medium"
            textDecoration="none"
          >
            Panel de Control
          </ChakraLink>

          {/* Inventario: solo admin/supervisores */}
          {isAdmin() && (
            <ChakraLink
              to="/inventory"
              color="gray.100"
              px={4}
              py={2}
              rounded="md"
              transition="all 0.2s"
              bg={isActive('/inventory') ? 'brand.400' : 'transparent'}
              _hover={{ bg: isActive('/inventory') ? 'brand.500' : 'dark.400' }}
              fontWeight="medium"
              textDecoration="none"
            >
              Inventario
            </ChakraLink>
          )}

          {/* Ventas y Gastos: visibles para todos */}
          <ChakraLink
            to="/sales"
            color="gray.100"
            px={4}
            py={2}
            rounded="md"
            transition="all 0.2s"
            bg={isActive('/sales') ? 'brand.400' : 'transparent'}
            _hover={{ bg: isActive('/sales') ? 'brand.500' : 'dark.400' }}
            fontWeight="medium"
            textDecoration="none"
          >
            Ventas
          </ChakraLink>

          <ChakraLink
            to="/expenses"
            color="gray.100"
            px={4}
            py={2}
            rounded="md"
            transition="all 0.2s"
            bg={isActive('/expenses') ? 'brand.400' : 'transparent'}
            _hover={{ bg: isActive('/expenses') ? 'brand.500' : 'dark.400' }}
            fontWeight="medium"
            textDecoration="none"
          >
            Gastos
          </ChakraLink>

          {/* Corte del día */}
          {showDaily && (
            <ChakraLink
              to="/daily-report"
              color="gray.100"
              px={4}
              py={2}
              rounded="md"
              transition="all 0.2s"
              bg={isActive('/daily-report') ? 'brand.400' : 'transparent'}
              _hover={{ bg: isActive('/daily-report') ? 'brand.500' : 'dark.400' }}
              fontWeight="medium"
              textDecoration="none"
            >
              Corte del Día
            </ChakraLink>
          )}

          {/* Usuarios y Configuración: solo admin/supervisores */}
          {isAdmin() && (
            <>
              <ChakraLink
                to="/users"
                color="gray.100"
                px={4}
                py={2}
                rounded="md"
                transition="all 0.2s"
                bg={isActive('/users') ? 'brand.400' : 'transparent'}
                _hover={{ bg: isActive('/users') ? 'brand.500' : 'dark.400' }}
                fontWeight="medium"
                textDecoration="none"
              >
                Usuarios
              </ChakraLink>

              <ChakraLink
                to="/configuration"
                color="gray.100"
                px={4}
                py={2}
                rounded="md"
                transition="all 0.2s"
                bg={isActive('/configuration') ? 'brand.400' : 'transparent'}
                _hover={{ bg: isActive('/configuration') ? 'brand.500' : 'dark.400' }}
                fontWeight="medium"
                textDecoration="none"
              >
                Configuración
              </ChakraLink>
            </>
          )}
        </HStack>

        <HStack gap={4}>
          <Text color="gray.100" fontSize="sm">
            {user?.firstName} {user?.lastName} ({user?.role})
          </Text>
          <Button
            size="sm"
            colorScheme="red"
            variant="outline"
            onClick={handleLogout}
            color="gray.100"
            borderColor="gray.300"
            _hover={{ bg: 'red.600', borderColor: 'red.600' }}
          >
            Cerrar Sesión
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
};

export default Navigation;