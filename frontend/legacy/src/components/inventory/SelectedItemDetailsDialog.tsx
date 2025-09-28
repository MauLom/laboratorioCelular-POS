
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area"; // Added import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InventoryItem, ProductType, Store } from "@/types/inventory";
import { Info, ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SelectedItemDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  itemsToShow: InventoryItem[];
  productTypes: ProductType[];
  stores: Store[];
}

export function SelectedItemDetailsDialog({
  isOpen,
  onOpenChange,
  itemsToShow,
  productTypes,
  stores,
}: SelectedItemDetailsDialogProps) {
  const { toast } = useToast();

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

  const handleCopyAllDetails = async () => {
    if (itemsToShow.length === 0) {
      toast({ title: "Sin Detalles", description: "No hay artículos para copiar.", variant: "destructive" });
      return;
    }

    let allDetailsText = "";
    itemsToShow.forEach((item, index) => {
      const product = getProductDetails(item.productTypeId);
      allDetailsText += `Artículo ${index + 1}:\n`;
      allDetailsText += `IMEI: ${item.imei}\n`;
      if (item.imei2) allDetailsText += `IMEI 2: ${item.imei2}\n`;
      allDetailsText += `Producto: ${product ? `${product.brand} ${product.model}` : "Desconocido"}\n`;
      allDetailsText += `Memoria: ${item.memory}\n`;
      if (item.color) allDetailsText += `Color: ${item.color}\n`;
      allDetailsText += `Proveedor: ${item.supplier}\n`;
      allDetailsText += `Precio Compra: ${formatPrice(item.purchasePrice)}\n`;
      allDetailsText += `ID Factura: ${item.purchaseInvoiceId}\n`;
      allDetailsText += `Fecha Factura: ${item.purchaseInvoiceDate}\n`;
      allDetailsText += `Estatus: ${item.status}\n`;
      allDetailsText += `Tienda Actual: ${getStoreName(item.storeId)}\n`;
      if (index < itemsToShow.length - 1) {
        allDetailsText += `--------------------\n`;
      }
    });

    try {
      await navigator.clipboard.writeText(allDetailsText.trim());
      toast({
        title: "Detalles Copiados",
        description: `Se copiaron los detalles de ${itemsToShow.length} artículo(s).`,
      });
    } catch (err) {
      console.error("Error al copiar detalles: ", err);
      toast({
        title: "Error al Copiar",
        description: "No se pudieron copiar los detalles al portapapeles.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5 text-primary" />
            Detalles de Artículos Seleccionados ({itemsToShow.length})
          </DialogTitle>
          <DialogDescription>
            Aquí puedes ver los detalles de los artículos que has seleccionado.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow my-4 pr-3"> {/* Added ScrollArea here */}
          {itemsToShow.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay artículos seleccionados para mostrar detalles.
            </p>
          ) : (
            <div className="space-y-3"> {/* This div is now inside ScrollArea */}
              {itemsToShow.map((item) => {
                const product = getProductDetails(item.productTypeId);
                return (
                  <Card key={item.imei} className="shadow-sm">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-md font-semibold">
                        IMEI: {item.imei}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs px-4 pb-3 space-y-0.5">
                      {item.imei2 && <p><strong>IMEI 2:</strong> {item.imei2}</p>}
                      <p><strong>Producto:</strong> {product ? `${product.brand} ${product.model}` : "Desconocido"}</p>
                      <p><strong>Memoria:</strong> {item.memory}</p>
                      {item.color && <p><strong>Color:</strong> {item.color}</p>}
                      <p><strong>Proveedor:</strong> {item.supplier}</p>
                      <p><strong>Precio Compra:</strong> {formatPrice(item.purchasePrice)}</p>
                      <p><strong>ID Factura:</strong> {item.purchaseInvoiceId}</p>
                      <p><strong>Fecha Factura:</strong> {item.purchaseInvoiceDate}</p>
                      <p><strong>Estatus:</strong> {item.status}</p>
                      <p><strong>Tienda Actual:</strong> {getStoreName(item.storeId)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-auto pt-4 border-t items-center justify-between"> {/* mt-auto helps keep footer at bottom */}
          <Button 
            type="button" 
            variant="default" 
            onClick={handleCopyAllDetails}
            disabled={itemsToShow.length === 0}
          >
            <ClipboardCopy className="mr-2 h-4 w-4" />
            Copiar Todo
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
