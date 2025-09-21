import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Box, HStack, chakra } from '@chakra-ui/react';

const ChakraLink = chakra(RouterLink);

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box bg="dark.500" py={4} px={8} shadow="sm">
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
      </HStack>
    </Box>
  );
};

export default Navigation;