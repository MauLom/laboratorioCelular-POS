"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Store, ProductType } from "@/types/inventory";
import { ListFilter, Warehouse, Smartphone } from "lucide-react";

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
    <div className="mb-6 p-4 border rounded-lg bg-card shadow">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <ListFilter className="mr-2 h-5 w-5 text-primary" />
        Filtros de Inventario
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="store-filter" className="text-sm font-medium mb-1 flex items-center">
            <Warehouse className="mr-2 h-4 w-4 text-muted-foreground" />
            Filtrar por Tienda
          </Label>
          <Select value={selectedStore} onValueChange={onStoreChange}>
            <SelectTrigger id="store-filter">
              <SelectValue placeholder="Todas las tiendas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Tiendas</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="model-filter" className="text-sm font-medium mb-1 flex items-center">
            <Smartphone className="mr-2 h-4 w-4 text-muted-foreground" />
            Filtrar por Modelo
          </Label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger id="model-filter">
              <SelectValue placeholder="Todos los modelos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Modelos</SelectItem>
              {uniqueModels.map((pt) => (
                <SelectItem key={pt.id} value={pt.model}> {/* Filter by model name for simplicity */}
                  {pt.model} ({pt.brand})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
