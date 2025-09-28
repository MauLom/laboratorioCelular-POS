"use client";

import { Label } from "@/components/ui/label";
import type { ProductType } from "@/types/inventory";

interface Store {
  id: string;
  name: string;
}

interface InventoryFiltersProps {
  stores: Store[];
  productTypes: ProductType[];
  selectedStore: string;
  onStoreChange: (storeId: string) => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function InventoryFilters({
  stores,
  productTypes,
  selectedStore,
  onStoreChange,
  selectedModel,
  onModelChange,
}: InventoryFiltersProps) {
  const uniqueModels = Array.from(new Set(productTypes.map(pt => pt.model)))
    .map(model => productTypes.find(pt => pt.model === model)!);

  return (
    <div className="mb-6 p-4 border rounded-lg bg-white shadow">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">🔍</span>
        Filtros de Inventario
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="store-filter" className="text-sm font-medium mb-1 flex items-center">
            <span className="mr-2">🏪</span>
            Filtrar por Tienda
          </Label>
          <select 
            id="store-filter"
            value={selectedStore} 
            onChange={(e) => onStoreChange(e.target.value)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las tiendas</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="model-filter" className="text-sm font-medium mb-1 flex items-center">
            <span className="mr-2">📱</span>
            Filtrar por Modelo
          </Label>
          <select 
            id="model-filter"
            value={selectedModel} 
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los modelos</option>
            {uniqueModels.map((productType) => (
              <option key={productType.id} value={productType.model}>
                {productType.brand} {productType.model}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}