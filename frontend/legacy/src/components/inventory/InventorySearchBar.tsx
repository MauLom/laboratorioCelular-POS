
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface InventorySearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function InventorySearchBar({
  searchQuery,
  onSearchQueryChange,
}: InventorySearchBarProps) {
  return (
    <div className="mb-6 p-4 border rounded-lg bg-card shadow">
      <Label htmlFor="inventory-search" className="text-lg font-semibold mb-3 flex items-center">
        <Search className="mr-2 h-5 w-5 text-primary" />
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
