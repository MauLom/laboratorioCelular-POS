import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  hideNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title = "Laboratorio Celular POS", hideNav = false }) => {
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Barra superior de navegación */}
      {!hideNav && <Navigation />}

      {/* Contenido principal */}
      <Container maxW="1200px" py={8}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;