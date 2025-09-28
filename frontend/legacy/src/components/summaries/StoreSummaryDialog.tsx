
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Warehouse } from "lucide-react";

interface StoreProductBreakdown {
  productTypeName: string;
  count: number;
}

interface DetailedStoreSummary {
  storeId: string;
  storeName: string;
  totalActiveCount: number;
  products: StoreProductBreakdown[];
}

interface StoreSummaryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  detailedStoreSummaries: DetailedStoreSummary[];
}

export function StoreSummaryDialog({
  isOpen,
  onOpenChange,
  detailedStoreSummaries,
}: StoreSummaryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center">
            <Warehouse className="mr-2 h-5 w-5 text-primary" />
            Resumen de Tiendas (Inventario Activo)
          </DialogTitle>
          <DialogDescription>
            Artículos activos por tienda y desglose por producto. Productos ordenados por cantidad (menor a mayor).
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0 px-6 py-4">
          {detailedStoreSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay tiendas con inventario activo.</p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {detailedStoreSummaries.map(summary => (
                <AccordionItem value={summary.storeId} key={summary.storeId}>
                  <AccordionTrigger className="hover:no-underline text-sm py-3">
                    <div className="flex justify-between items-center w-full pr-2">
                      <span>{summary.storeName}</span>
                      <span className="font-semibold text-primary">{summary.totalActiveCount} art.</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {summary.products.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2 py-1">No hay productos activos en esta tienda.</p>
                    ) : (
                      <ul className="space-y-1 text-xs pl-6 pr-2 pt-1 pb-2">
                        {summary.products.map(prod => (
                          <li key={prod.productTypeName} className="flex justify-between items-center py-0.5">
                            <span>{prod.productTypeName}</span>
                            <span className="font-medium">{prod.count}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
