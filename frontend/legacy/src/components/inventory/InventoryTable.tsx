
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import type { InventoryItem, ProductType, Store, UserRole } from "@/types/inventory";
import { PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryTableProps {
  items: InventoryItem[];
  productTypes: ProductType[];
  stores: Store[];
  selectedItemImeis: string[];
  onToggleSelectItem: (imei: string) => void;
  onToggleSelectAll: () => void;
  actionsDisabled?: boolean; 
  currentUserRole?: UserRole;
}

export function InventoryTable({
  items,
  productTypes,
  stores,
  selectedItemImeis,
  onToggleSelectItem,
  onToggleSelectAll,
  actionsDisabled = false,
  currentUserRole,
}: InventoryTableProps) {
  const getProductDetails = (productTypeId: string) => {
    return productTypes.find((pt) => pt.id === productTypeId);
  };

  const getStoreName = (storeId: string) => {
    return stores.find((s) => s.id === storeId)?.name || "N/A";
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "N/A";
    return `$${price.toFixed(2)}`;
  };

  const isCheckboxesDisabled = actionsDisabled || currentUserRole === 'consultas';

  const isAllSelected = items.length > 0 && selectedItemImeis.length === items.length;
  const isAnySelected = selectedItemImeis.length > 0;
  const isIndeterminate = isAnySelected && !isAllSelected;

  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <PackageSearch className="mx-auto h-12 w-12 mb-4" />
        <p className="text-lg">No hay artículos que coincidan con los criterios de búsqueda y filtros.</p>
        <p>Intenta registrar nuevos productos o artículos, o ajusta tu búsqueda/filtros.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              {currentUserRole === 'admin' && (
                <Checkbox
                  checked={isIndeterminate ? 'indeterminate' : isAllSelected}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Seleccionar todos los artículos"
                  disabled={items.length === 0 || isCheckboxesDisabled}
                />
              )}
            </TableHead>
            <TableHead>IMEI</TableHead>
            <TableHead>IMEI 2</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Memoria</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>P. Compra</TableHead>
            <TableHead>ID Factura</TableHead>
            <TableHead>Fecha Factura</TableHead>
            <TableHead>Estatus</TableHead>
            <TableHead>Tienda Actual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const product = getProductDetails(item.productTypeId);
            const isSelected = selectedItemImeis.includes(item.imei);
            return (
              <TableRow
                key={item.imei}
                data-state={isSelected && currentUserRole === 'admin' ? "selected" : undefined}
                className={cn(isSelected && currentUserRole === 'admin' && "bg-muted/50")}
              >
                <TableCell>
                 {currentUserRole === 'admin' && (
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelectItem(item.imei)}
                        aria-label={`Seleccionar artículo con IMEI ${item.imei}`}
                        disabled={isCheckboxesDisabled}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">{item.imei}</TableCell>
                <TableCell className="whitespace-nowrap">{item.imei2 || "N/A"}</TableCell>
                <TableCell>{product?.brand || "N/A"}</TableCell>
                <TableCell>{product?.model || "N/A"}</TableCell>
                <TableCell>{item.memory}</TableCell>
                <TableCell>{item.color || "N/A"}</TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell className="whitespace-nowrap">{formatPrice(item.purchasePrice)}</TableCell>
                <TableCell className="whitespace-nowrap">{item.purchaseInvoiceId}</TableCell>
                <TableCell className="whitespace-nowrap">{item.purchaseInvoiceDate}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{getStoreName(item.storeId)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
