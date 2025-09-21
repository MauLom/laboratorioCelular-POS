import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Layout from '../components/common/Layout';
import Navigation from '../components/common/Navigation';
import InventoryForm from '../components/inventory/InventoryForm';
import InventoryList from '../components/inventory/InventoryList';
import { inventoryApi } from '../services/api';
import { InventoryItem, PaginatedResponse } from '../types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
  margin: 0;
  color: #2c3e50;
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const Modal = styled.div<{ isOpen: boolean }>`
  display: ${({ isOpen }) => isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  
  &:hover {
    color: #343a40;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
`;

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
      alert('Failed to fetch inventory items');
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
      alert('Item added successfully!');
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Failed to add item');
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
      alert('Item updated successfully!');
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Failed to update item');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteItem = async (imei: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await inventoryApi.delete(imei);
      fetchItems();
      alert('Item deleted successfully!');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const openEditForm = (item: InventoryItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(undefined);
  };

  return (
    <Layout title="Inventory Management">
      <Navigation />
      <Container>
        <Header>
          <Title>Inventory Items</Title>
          <Button onClick={() => setShowForm(true)}>Add New Item</Button>
        </Header>

        <FilterContainer>
          <Select
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          >
            <option value="">All States</option>
            <option value="New">New</option>
            <option value="Repair">Repair</option>
            <option value="Repaired">Repaired</option>
            <option value="Sold">Sold</option>
            <option value="Lost">Lost</option>
            <option value="Clearance">Clearance</option>
          </Select>
          
          <Select
            value={filters.branch}
            onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
          >
            <option value="">All Branches</option>
            <option value="Main">Main</option>
            <option value="Branch 1">Branch 1</option>
            <option value="Branch 2">Branch 2</option>
          </Select>
        </FilterContainer>

        <InventoryList
          items={items}
          onEdit={openEditForm}
          onDelete={handleDeleteItem}
          loading={loading}
        />

        <Modal isOpen={showForm}>
          <ModalContent>
            <CloseButton onClick={closeForm}>&times;</CloseButton>
            <InventoryForm
              onSubmit={editingItem ? handleEditItem : handleAddItem}
              initialData={editingItem}
              isEditing={!!editingItem}
              isLoading={formLoading}
            />
          </ModalContent>
        </Modal>
      </Container>
    </Layout>
  );
};

export default InventoryPage;