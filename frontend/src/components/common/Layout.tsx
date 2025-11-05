import React from 'react';
import { Box, Heading, Container } from '@chakra-ui/react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  hideNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title = "Laboratorio Celular POS", hideNav = false }) => {
  return (
    <Box minH="100vh" bg="gray.50">
      {/* ✅ Barra superior de navegación */}
      {!hideNav && <Navigation />}

      {/* Encabezado con título */}
      <Box bg="dark.400" color="white" py={4} px={8} shadow="md">
        <Heading size="lg" fontWeight="semibold" m={0}>
          {title}
        </Heading>
      </Box>

      {/* Contenido principal */}
      <Container maxW="1200px" py={8}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;