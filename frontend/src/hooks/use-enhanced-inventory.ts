import { useState, useEffect, useMemo } from 'react';
import type { EnhancedInventoryItem, ProductType } from '@/types/inventory';

// Enhanced inventory hook with filtering and search capabilities
export function useEnhancedInventory(items: EnhancedInventoryItem[] = [], productTypes: ProductType[] = []) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Filtered items based on search and filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const productType = productTypes.find(pt => pt.id === item.productTypeId);
        const searchFields = [
          item.imei,
          item.imei2,
          item.color,
          item.supplier,
          item.status,
          productType?.brand,
          productType?.model,
          item.memory,
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchFields.includes(query)) {
          return false;
        }
      }

      // Store filter
      if (selectedStore && item.storeId !== selectedStore) {
        return false;
      }

      // Model filter
      if (selectedModel) {
        const productType = productTypes.find(pt => pt.id === item.productTypeId);
        if (productType?.model !== selectedModel) {
          return false;
        }
      }

      return true;
    });
  }, [items, productTypes, searchQuery, selectedStore, selectedModel]);

  // Selection handlers
  const toggleItemSelection = (imei: string) => {
    setSelectedItems(prev => 
      prev.includes(imei) 
        ? prev.filter(id => id !== imei)
        : [...prev, imei]
    );
  };

  const toggleAllSelection = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.imei));
    }
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Bulk operations handlers (placeholder implementations)
  const handleBulkChangeStatus = () => {
    console.log('Bulk change status for items:', selectedItems);
    // TODO: Implement actual bulk status change
  };

  const handleBulkTransfer = () => {
    console.log('Bulk transfer for items:', selectedItems);
    // TODO: Implement actual bulk transfer
  };

  const handleBulkDelete = () => {
    console.log('Bulk delete for items:', selectedItems);
    // TODO: Implement actual bulk delete
  };

  const handleBulkSelectByImei = () => {
    console.log('Open bulk select by IMEI dialog');
    // TODO: Implement bulk select by IMEI
  };

  const handleShowDetails = () => {
    console.log('Show details for items:', selectedItems);
    // TODO: Implement show details
  };

  return {
    // Data
    filteredItems,
    selectedItems,
    selectedCount: selectedItems.length,
    
    // Search and filters
    searchQuery,
    setSearchQuery,
    selectedStore,
    setSelectedStore,
    selectedModel,
    setSelectedModel,
    
    // Selection handlers
    toggleItemSelection,
    toggleAllSelection,
    clearSelection,
    
    // Bulk operations
    handleBulkChangeStatus,
    handleBulkTransfer,
    handleBulkDelete,
    handleBulkSelectByImei,
    handleShowDetails,
  };
}