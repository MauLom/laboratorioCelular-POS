
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shapes } from "lucide-react"; 
import type { ProductType, InventoryItem } from "@/types/inventory";

interface ProductTypeSummaryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productTypes: ProductType[];
  activeInventoryItems: InventoryItem[];
}

export function ProductTypeSummaryDialog({
  isOpen,
  onOpenChange,
  productTypes,
  activeInventoryItems,
}: ProductTypeSummaryDialogProps) {

  const sortedProductTypes = [...productTypes].sort((a,b) => {
    const countA = activeInventoryItems.filter(item => item.productTypeId === a.id).length;
    const countB = activeInventoryItems.filter(item => item.productTypeId === b.id).length;
    if (countA !== countB) {
        return countA - countB; 
    }
    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) {
        return brandCompare;
    }
    return a.model.localeCompare(b.model);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center">
            <Shapes className="mr-2 h-5 w-5 text-primary" />
            Resumen de Tipos de Producto (Inventario Activo)
          </DialogTitle>
          <DialogDescription>
            Artículos activos por tipo de producto, ordenado por cantidad (menor a mayor) y luego alfabéticamente.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0 px-6 py-4">
          {sortedProductTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay tipos de producto registrados.</p>
          ) : (
            <ul className="space-y-2">
              {sortedProductTypes.map(pt => {
                const count = activeInventoryItems.filter(item => item.productTypeId === pt.id).length;
                return (
                  <li key={pt.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-secondary/50 transition-colors">
                    <span className="flex-grow">{pt.brand} {pt.model}</span>
                    <span className="font-semibold text-primary mr-2">{count} art.</span>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <DialogFooter className="p-6 pt-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
