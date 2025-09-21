import React from 'react';
import { Box, Heading, Container } from '@chakra-ui/react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = "Laboratorio Celular POS" }) => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="dark.400" color="white" py={4} px={8} shadow="md">
        <Heading size="lg" fontWeight="semibold" m={0}>
          {title}
        </Heading>
      </Box>
      <Container maxW="1200px" py={8}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;