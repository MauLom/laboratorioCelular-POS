"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InventorySearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function InventorySearchBar({
  searchQuery,
  onSearchQueryChange,
}: InventorySearchBarProps) {
  return (
    <div className="mb-6 p-4 border rounded-lg bg-white shadow">
      <Label htmlFor="inventory-search" className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">🔍</span>
        Buscar en Inventario
      </Label>
      <Input
        id="inventory-search"
        type="text"
        placeholder="Buscar por IMEI, modelo, proveedor, estatus, etc."
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}