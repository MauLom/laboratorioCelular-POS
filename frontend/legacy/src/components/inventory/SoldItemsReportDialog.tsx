
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { InventoryItem, ProductType, Store } from "@/types/inventory";
import { DollarSign, ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SoldItemsReportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  inventoryItems: InventoryItem[];
  productTypes: ProductType[];
  stores: Store[];
}

export function SoldItemsReportDialog({
  isOpen,
  onOpenChange,
  inventoryItems,
  productTypes,
  stores,
}: SoldItemsReportDialogProps) {
  const { toast } = useToast();

  const soldItems = useMemo(() => {
    return inventoryItems
        .filter(item => item.status === "Vendido")
        .sort((a,b) => a.imei.localeCompare(b.imei)); // Sort by IMEI for consistent order
  }, [inventoryItems]);

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
  
  const generateReportText = () => {
    let report = `**REPORTE DE VENTAS**\n`;
    report += `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es })}\n`;
    report += `Total Artículos Vendidos: ${soldItems.length}\n\n`;
    report += `---------------------------------\n`;

    soldItems.forEach((item, index) => {
      const product = getProductDetails(item.productTypeId);
      report += `${index + 1}. IMEI: ${item.imei}\n`;
      if(item.imei2) report += `   IMEI 2: ${item.imei2}\n`;
      report += `   Producto: ${product ? `${product.brand} ${product.model}` : "Desconocido"}\n`;
      report += `   Memoria: ${item.memory}\n`;
      if (item.color) report += `   Color: ${item.color}\n`;
      report += `   Tienda (Venta): ${getStoreName(item.storeId)}\n`;
      report += `   Precio Compra: ${formatPrice(item.purchasePrice)}\n`;
      // Consider adding sale date if available from logs in future iterations
      if (index < soldItems.length - 1) {
        report += `---------------------------------\n`;
      }
    });
    report += `---------------------------------\n`;
    return report;
  };

  const reportTextContent = useMemo(generateReportText, [soldItems, productTypes, stores]);


  const handleCopyToClipboard = async () => {
    if (!reportTextContent) {
      toast({ title: "Sin Contenido", description: "No hay reporte generado para copiar.", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(reportTextContent);
      toast({ title: "Reporte Copiado", description: "El reporte de ventas ha sido copiado." });
    } catch (err) {
      toast({ title: "Error al Copiar", description: "No se pudo copiar el reporte.", variant: "destructive" });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-primary" />
            Reporte de Artículos Vendidos ({soldItems.length})
          </DialogTitle>
          <DialogDescription>
            Listado de todos los artículos marcados como "Vendido" en el inventario.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow my-3 space-y-3 pr-1">
          <div className="flex justify-end">
            <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                size="sm"
                disabled={soldItems.length === 0}
            >
                <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar Reporte Completo
            </Button>
          </div>

          {soldItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay artículos vendidos registrados.
            </p>
          ) : (
            <>
                <Label htmlFor="sold-report-output" className="sr-only">Reporte Generado:</Label>
                <Textarea
                    id="sold-report-output"
                    readOnly
                    value={reportTextContent}
                    className="h-72 w-full text-xs font-mono bg-muted/20 p-2 focus:ring-0 focus:outline-none resize-none"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <p className="text-xs text-muted-foreground">
                    El reporte anterior contiene todos los artículos vendidos. Puedes copiarlo o ver los detalles individuales abajo.
                </p>

                <h3 className="text-md font-semibold pt-2">Detalle Individual de Artículos Vendidos:</h3>
                 <ScrollArea className="h-64 border rounded-md p-2">
                    <div className="space-y-2">
                    {soldItems.map((item) => {
                        const product = getProductDetails(item.productTypeId);
                        return (
                        <Card key={item.imei} className="shadow-sm bg-card/80">
                            <CardHeader className="pb-1 pt-2 px-3">
                            <CardTitle className="text-sm font-semibold">
                                IMEI: {item.imei}
                            </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs px-3 pb-2 space-y-0.5">
                            {item.imei2 && <p><strong>IMEI 2:</strong> {item.imei2}</p>}
                            <p><strong>Producto:</strong> {product ? `${product.brand} ${product.model}` : "Desconocido"}</p>
                            <p><strong>Memoria:</strong> {item.memory}</p>
                            {item.color && <p><strong>Color:</strong> {item.color}</p>}
                            <p><strong>Tienda (Venta):</strong> {getStoreName(item.storeId)}</p>
                            <p><strong>Precio Compra:</strong> {formatPrice(item.purchasePrice)}</p>
                            <p><strong>ID Factura (Original):</strong> {item.purchaseInvoiceId}</p>
                            <p><strong>Fecha Factura (Original):</strong> {item.purchaseInvoiceDate}</p>
                            </CardContent>
                        </Card>
                        );
                    })}
                    </div>
                </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

