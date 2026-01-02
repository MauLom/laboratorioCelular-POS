import React, { useState, useEffect, useCallback } from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
  Button,
  chakra,
} from '@chakra-ui/react';
import Navigation from '../components/common/Navigation';
import AddInventoryForm from '../components/inventory/AddInventoryForm';
import InventoryForm from '../components/inventory/InventoryForm';
import InventoryList from '../components/inventory/InventoryList';
import { inventoryApi, franchiseLocationsApi } from '../services/api';
import { useAuth } from "../contexts/AuthContext";
import { InventoryItem, PaginatedResponse } from '../types';
import { useAlert } from '../hooks/useAlert';
import styled from 'styled-components';
import BulkImeisModal from '../components/inventory/BulkImeiModal';
import BulkCheckModal from "../components/inventory/BulkCheckModal";

// Use native HTML select with Chakra styling

const Page = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
`;

const Select = chakra('select');

const InventoryPage: React.FC = () => {
  const { success, error } = useAlert();
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({
    state: '',
    franchiseLocation: '',
    imei: '',
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<InventoryItem> = await inventoryApi.getAll(filters);
      setItems(response.items || []);
    } catch (err) {
      console.error('Failed to fetch inventory items:', err);
      error('Error al cargar los artículos del inventario');
    } finally {
      setLoading(false);
    }
  }, [filters, error]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await franchiseLocationsApi.getActive();
        setBranches(res);
      } catch (err) {
        console.error("Error cargando sucursales", err);
      }
    };
    
    loadBranches();
  }, []);  

  // Note: AddInventoryForm handles its own submission, this is just for refresh callback
  const handleAddItem = () => {
    // This function is called by AddInventoryForm after successful submission
    fetchItems();
  };

  const handleEditItem = async (itemData: Partial<InventoryItem>) => {
    if (!editingItem) return;

    setFormLoading(true);
    try {
      await inventoryApi.update(editingItem.imei, itemData);
      setEditingItem(undefined);
      setShowForm(false);
      fetchItems();
      success('¡Artículo actualizado exitosamente!');
    } catch (err) {
      console.error('Failed to update item:', err);
      error('Error al actualizar el artículo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteItem = async (imei: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este artículo?')) return;

    try {
      await inventoryApi.delete(imei);
      fetchItems();
      success('¡Artículo eliminado exitosamente!');
    } catch (err) {
      console.error('Failed to delete item:', err);
      error('Error al eliminar el artículo');
    }
  };

  const openEditForm = (item: InventoryItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const openAddForm = () => {
    setEditingItem(undefined);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(undefined);
  };

  return (
    <Page>
      <Navigation />
      <Container title="Gestión de Inventario">
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Box bg="white" p={6} rounded="lg" shadow="md">
            <HStack justify="space-between" align="center">
              <Heading size="lg" color="dark.400">
                Artículos del Inventario
              </Heading>
                {!['Vendedor', 'Cajero'].includes(user?.role || '') && (
                  <HStack gap={3}>
                <Button colorScheme="purple" onClick={() => setShowBulkModal(true)}>
                  Procesar Multiples IMEIs
                </Button>
                <Button colorScheme="orange" onClick={() => setShowCheckModal(true)}>
                  Buscar IMEIs en inventario
                </Button>
                </HStack>
                )}
              {!['Vendedor', 'Cajero'].includes(user?.role || '') && (
              <Button colorScheme="blue" onClick={openAddForm}>
                Agregar Nuevo Artículo
              </Button>
              )} 
            </HStack>
          </Box>

          {/* Filters */}
          <Box bg="white" p={4} rounded="lg" shadow="sm">
            <HStack gap={4} wrap="wrap">
              <Select
                value={filters.state}
                onChange={(e: any) => setFilters({ ...filters, state: e.target.value })}
                maxW="200px"
                p={2}
                border="1px solid"
                borderColor="gray.300"
                rounded="md"
                bg="white"
              >
                <option value="">Todos los Estados</option>
                <option value="New">Nuevo</option>
                <option value="Repair">En Reparación</option>
                <option value="Repaired">Reparado</option>
                <option value="Sold">Vendido</option>
                <option value="Lost">Perdido</option>
                <option value="Clearance">Liquidación</option>
              </Select>

             {!['Vendedor', 'Cajero'].includes(user?.role || '') && (
              <Select
                value={filters.franchiseLocation}
                onChange={(e: any) => setFilters({ ...filters, franchiseLocation: e.target.value })}
                maxW="200px"
                p={2}
                border="1px solid"
                borderColor="gray.300"
                rounded="md"
                bg="white"
              >
                <option value="">Todas las Sucursales</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}  
              </Select>
             )}

             <input
               type="text"
               placeholder="Buscar por IMEI"
               value={filters.imei}
               onChange={(e) =>
                setFilters({ ...filters, imei: e.target.value })
               }
               style={{
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                width: "200px",
               }}
              />  
            </HStack>
          </Box>

          {/* Inventory List */}
          <InventoryList
            items={items}
            onEdit={openEditForm}
            onDelete={handleDeleteItem}
            loading={loading}
          />

          {/* Modal for Add Form */}
          {showForm && !editingItem && (
            <AddInventoryForm
              onClose={closeForm}
              onSubmit={handleAddItem}
            />
          )}
          
          {/* Modal for Edit Form - Keep old form for editing */}
          {showForm && editingItem && (
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
              minW="800px"
            >
              <Box
                bg="white"
                p={6}
                rounded="lg"
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
                  h="auto"
                >
                  ×
                </Button>
                <InventoryForm
                  onSubmit={handleEditItem}
                  initialData={editingItem}
                  isEditing={true}
                  isLoading={formLoading}
                />
              </Box>
            </Box>
          )}
        </VStack>
      </Container>

      <BulkImeisModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onUpdated={fetchItems}
      />

      <BulkCheckModal
        isOpen={showCheckModal}
        onClose={() => setShowCheckModal(false)}
      />  
    </Page>


  );
};

export default InventoryPage;