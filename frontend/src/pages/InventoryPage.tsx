import React, { useState, useEffect, useCallback } from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
  Button,
  chakra,
} from '@chakra-ui/react';
import Layout from '../components/common/Layout';
import Navigation from '../components/common/Navigation';
import InventoryForm from '../components/inventory/InventoryForm';
import InventoryList from '../components/inventory/InventoryList';
import { inventoryApi } from '../services/api';
import { InventoryItem, PaginatedResponse } from '../types';

// Use native HTML select with Chakra styling
const Select = chakra('select');

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({
    state: '',
    branch: '',
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<InventoryItem> = await inventoryApi.getAll(filters);
      setItems(response.items || []);
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
      alert('Error al cargar los artículos del inventario');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async (itemData: Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt'>) => {
    setFormLoading(true);
    try {
      await inventoryApi.create(itemData);
      setShowForm(false);
      fetchItems();
      alert('¡Artículo agregado exitosamente!');
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Error al agregar el artículo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditItem = async (itemData: Partial<InventoryItem>) => {
    if (!editingItem) return;
    
    setFormLoading(true);
    try {
      await inventoryApi.update(editingItem.imei, itemData);
      setEditingItem(undefined);
      setShowForm(false);
      fetchItems();
      alert('¡Artículo actualizado exitosamente!');
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Error al actualizar el artículo');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteItem = async (imei: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este artículo?')) return;
    
    try {
      await inventoryApi.delete(imei);
      fetchItems();
      alert('¡Artículo eliminado exitosamente!');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Error al eliminar el artículo');
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
    <Layout title="Gestión de Inventario">
      <Navigation />
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box bg="white" p={6} rounded="lg" shadow="md">
          <HStack justify="space-between" align="center">
            <Heading size="lg" color="dark.400">
              Artículos del Inventario
            </Heading>
            <Button colorScheme="blue" onClick={openAddForm}>
              Agregar Nuevo Artículo
            </Button>
          </HStack>
        </Box>

        {/* Filters */}
        <Box bg="white" p={4} rounded="lg" shadow="sm">
          <HStack gap={4} wrap="wrap">
            <Select
              placeholder="Todos los Estados"
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
            
            <Select
              placeholder="Todas las Sucursales"
              value={filters.branch}
              onChange={(e: any) => setFilters({ ...filters, branch: e.target.value })}
              maxW="200px"
              p={2}
              border="1px solid"
              borderColor="gray.300"
              rounded="md"
              bg="white"
            >
              <option value="">Todas las Sucursales</option>
              <option value="Main">Principal</option>
              <option value="Branch 1">Sucursal 1</option>
              <option value="Branch 2">Sucursal 2</option>
            </Select>
          </HStack>
        </Box>

        {/* Inventory List */}
        <InventoryList
          items={items}
          onEdit={openEditForm}
          onDelete={handleDeleteItem}
          loading={loading}
        />

        {/* Simple Modal for Add/Edit Form */}
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
              <InventoryForm
                onSubmit={editingItem ? handleEditItem : handleAddItem}
                initialData={editingItem}
                isEditing={!!editingItem}
                isLoading={formLoading}
              />
            </Box>
          </Box>
        )}
      </VStack>
    </Layout>
  );
};

export default InventoryPage;