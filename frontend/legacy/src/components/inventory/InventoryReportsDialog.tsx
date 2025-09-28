
"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { InventoryItem, ProductType, Store } from "@/types/inventory";
import { FileSpreadsheet, ClipboardCopy, X, ChevronsUpDown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InventoryReportsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  inventoryItems: InventoryItem[];
  productTypes: ProductType[];
  stores: Store[];
}

type ReportType = "general" | "store" | "specific_products";
type ReportFieldKey = "imei" | "product" | "memory" | "color" | "store" | "status" | "price";

const REPORT_FIELD_LABELS: Record<ReportFieldKey, string> = {
  imei: "IMEI",
  product: "Producto (Marca/Modelo)",
  memory: "Memoria",
  color: "Color",
  store: "Tienda",
  status: "Estatus",
  price: "Precio Compra",
};

const groupArrayBy = <T extends Record<string, any>>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, currentValue) => {
    const groupKey = currentValue[key] as string;
    (result[groupKey] = result[groupKey] || []).push(currentValue);
    return result;
  }, {} as Record<string, T[]>);
};


export function InventoryReportsDialog({
  isOpen,
  onOpenChange,
  inventoryItems,
  productTypes,
  stores,
}: InventoryReportsDialogProps) {
  const { toast } = useToast();
  const [selectedReportType, setSelectedReportType] = useState<ReportType | "">("");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [reportText, setReportText] = useState<string>("");
  const [selectedProductTypeIdsForFilter, setSelectedProductTypeIdsForFilter] = useState<string[]>([]);
  const [productFilterComboboxOpen, setProductFilterComboboxOpen] = useState(false);

  const [selectedFields, setSelectedFields] = useState<Record<ReportFieldKey, boolean>>({
    imei: true,
    product: true,
    memory: true,
    color: true,
    store: true,
    status: true,
    price: false,
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedReportType("");
      setSelectedStoreId("");
      setReportText("");
      setSelectedFields({ imei: true, product: true, memory: true, color: true, store: true, status: true, price: false });
      setSelectedProductTypeIdsForFilter([]);
      setProductFilterComboboxOpen(false);
    } else {
        setReportText("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setReportText("");
       if (selectedReportType !== "specific_products") {
        setSelectedProductTypeIdsForFilter([]);
      }
    }
  }, [selectedReportType, selectedStoreId, isOpen]);


  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "N/A";
    return `$${price.toFixed(2)}`;
  };

  const generateReport = () => {
    // Filter out "Vendido" and "Perdido" items from the base list first
    let currentItemsToReport: InventoryItem[] = inventoryItems.filter(
      item => item.status !== "Vendido" && item.status !== "Perdido"
    );
    let newReportText = "";
    const now = new Date();
    const formattedTimestamp = format(now, "dd/MM/yyyy HH:mm:ss", { locale: es });
    let reportBaseTitle = "";

    // 1. Initial filtering based on selected products (if applicable)
    if (selectedReportType === "specific_products") {
      if (selectedProductTypeIdsForFilter.length === 0) {
        setReportText("Por favor, selecciona al menos un tipo de producto para este reporte.");
        return;
      }
      currentItemsToReport = currentItemsToReport.filter(item =>
        selectedProductTypeIdsForFilter.includes(item.productTypeId)
      );
      reportBaseTitle = "**REPORTE DE INVENTARIO ACTIVO - PRODUCTOS SELECCIONADOS**";
    }

    // 2. Further filtering by store if "Por Tienda Específica" or ("Por Productos Específicos" AND a store is selected)
    if (selectedReportType === "store" || (selectedReportType === "specific_products" && selectedStoreId)) {
      if (!selectedStoreId) {
         if (selectedReportType === "store") { // Only error out if "store" report type explicitly chosen without store
            toast({ title: "Error", description: "Tienda no seleccionada.", variant: "destructive" });
            return;
         }
        // For specific_products, if no storeId, it means all stores for those products
      } else {
        const store = stores.find(s => s.id === selectedStoreId);
        if (!store) {
          toast({ title: "Error", description: "Tienda no encontrada.", variant: "destructive" });
          return;
        }
        currentItemsToReport = currentItemsToReport.filter(item => item.storeId === selectedStoreId);
        if (selectedReportType === "store") {
            reportBaseTitle = `**REPORTE INVENTARIO ACTIVO - ${store.name.toUpperCase()}**`;
        } else { // specific_products and store
            reportBaseTitle += ` - TIENDA: ${store.name.toUpperCase()}`;
        }
      }
    } else if (selectedReportType === "general") {
      reportBaseTitle = `**REPORTE GENERAL DE INVENTARIO ACTIVO**`;
    }


    newReportText += `${reportBaseTitle}\n`;
    newReportText += `Generado: ${formattedTimestamp}\n`;

    // 3. Summary Section (based on currently filtered items)
    newReportText += `Total Artículos en Reporte (Activo): ${currentItemsToReport.length}\n`;
    
    // Only show per-store summary if we are not already filtered by a single store AND not product specific with no store selected
    const showPerStoreSummary = selectedReportType === "general" || (selectedReportType === "specific_products" && !selectedStoreId);

    if (showPerStoreSummary) {
      const storesInReport = Array.from(new Set(currentItemsToReport.map(item => item.storeId)))
        .map(storeId => stores.find(s => s.id === storeId))
        .filter(Boolean) as Store[];

      if (storesInReport.length > 0) {
         storesInReport.sort((a,b) => a.name.localeCompare(b.name)).forEach(store => {
          const count = currentItemsToReport.filter(item => item.storeId === store.id).length;
          if (count > 0) {
            newReportText += `  ${store.name}: ${count} art.\n`;
          }
        });
      }
    }
    newReportText += `\n`;

    if (currentItemsToReport.length === 0) {
      newReportText += `No hay artículos activos que coincidan con los criterios seleccionados.`;
      setReportText(newReportText);
      return;
    }

    let itemCounter = 1;
    const getProductSortKey = (productTypeId: string): string => {
        const product = productTypes.find(pt => pt.id === productTypeId);
        return product ? `${product.brand} ${product.model}`.toLowerCase() : '';
    };

    const processStoreItems = (itemsForStore: InventoryItem[], storeName?: string) => {
      if (storeName) {
        newReportText += `TIENDA: ${storeName.toUpperCase()}\n`;
        newReportText += `--------------------\n`;
      }
      const itemsGroupedByProduct = groupArrayBy(itemsForStore, 'productTypeId');
      const sortedProductTypeIds = Object.keys(itemsGroupedByProduct).sort((a, b) =>
          getProductSortKey(a).localeCompare(getProductSortKey(b))
      );

      for (const productTypeId of sortedProductTypeIds) {
          const product = productTypes.find(pt => pt.id === productTypeId);
          newReportText += `Producto: ${product ? `${product.brand} ${product.model}` : "Desconocido"}\n`;

          const productItems = itemsGroupedByProduct[productTypeId].sort((a,b) => a.imei.localeCompare(b.imei));
          for (const item of productItems) {
              newReportText += `  ${itemCounter}. IMEI: ${item.imei}\n`;

              let detailsLineParts: string[] = [];
              if (selectedFields.memory && item.memory) detailsLineParts.push(`Mem: ${item.memory}`);
              if (selectedFields.color && item.color) detailsLineParts.push(`Color: ${item.color}`);
              if (selectedFields.status && item.status) detailsLineParts.push(`Est: ${item.status}`);
              if (selectedFields.price) detailsLineParts.push(`PC: ${formatPrice(item.purchasePrice)}`);
              
              if (detailsLineParts.length > 0) {
                  newReportText += `     ${detailsLineParts.join(', ')}\n`;
              }
              itemCounter++;
          }
          newReportText += `\n`;
      }
    };
    
    if (selectedReportType === "general" || (selectedReportType === "specific_products" && !selectedStoreId)) {
        const itemsGroupedByStore = groupArrayBy(currentItemsToReport, 'storeId');
        const sortedStoreIds = Object.keys(itemsGroupedByStore).sort((a,b) => {
            const storeNameA = stores.find(s => s.id === a)?.name || "";
            const storeNameB = stores.find(s => s.id === b)?.name || "";
            return storeNameA.localeCompare(storeNameB);
        });
        sortedStoreIds.forEach(storeId => {
            const store = stores.find(s => s.id === storeId);
            processStoreItems(itemsGroupedByStore[storeId], store?.name);
        });
    } else { // "store" or ("specific_products" AND a store is selected)
        processStoreItems(currentItemsToReport);
    }

    setReportText(newReportText.trimEnd());
  };

  const handleCopyToClipboard = async () => {
    if (!reportText) {
      toast({ title: "Sin Contenido", description: "No hay reporte generado para copiar.", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(reportText);
      toast({ title: "Reporte Copiado", description: "El reporte ha sido copiado al portapapeles." });
    } catch (err) {
      toast({ title: "Error al Copiar", description: "No se pudo copiar el reporte.", variant: "destructive" });
    }
  };

  const fieldCheckbox = (fieldKey: ReportFieldKey, label: string) => {
    let isDisabled = false;
    if (fieldKey === "imei" || fieldKey === "product") {
        isDisabled = true;
    }
    if (fieldKey === "store" && selectedReportType !== "general" && !(selectedReportType === "specific_products" && !selectedStoreId)) {
        return null;
    }
     if (fieldKey === "store" && (selectedReportType === "general" || (selectedReportType === "specific_products" && !selectedStoreId))) {
        isDisabled = true;
    }

    // El campo "status" tampoco debería ser deseleccionable si estamos reportando solo activos,
    // ya que su valor será implícitamente "activo". O, si se muestra, solo mostrará estados activos.
    // Por ahora, lo mantenemos como está, pero podría ser una mejora futura.
    // if (fieldKey === "status") { 
    //   isDisabled = true; // Si siempre son activos, no tiene sentido cambiarlo
    // }


    return (
        <div key={fieldKey} className="flex items-center space-x-2">
            <Checkbox
                id={`field-${fieldKey}`}
                checked={selectedFields[fieldKey]}
                onCheckedChange={(checked) =>
                    setSelectedFields(prev => ({ ...prev, [fieldKey]: !!checked }))
                }
                disabled={isDisabled}
            />
            <Label htmlFor={`field-${fieldKey}`} className={`font-normal text-sm ${isDisabled ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}>
                {label}
            </Label>
        </div>
    );
  };

  const handleProductTypeToggle = (productTypeId: string) => {
    setSelectedProductTypeIdsForFilter((prevSelected) =>
      prevSelected.includes(productTypeId)
        ? prevSelected.filter((id) => id !== productTypeId)
        : [...prevSelected, productTypeId]
    );
  };
  
  const selectedProductNames = useMemo(() => {
    return selectedProductTypeIdsForFilter.map(id => {
        const pt = productTypes.find(p => p.id === id);
        return pt ? `${pt.brand} ${pt.model}` : 'Desconocido';
    });
  }, [selectedProductTypeIdsForFilter, productTypes]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileSpreadsheet className="mr-2 h-5 w-5 text-primary" />
            Generar Reporte de Inventario Activo
          </DialogTitle>
          <DialogDescription>
            Selecciona el tipo de reporte y los campos que deseas incluir en los detalles de cada artículo.
            Los artículos "Vendido" o "Perdido" se excluirán de este reporte.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="report-type-select">Tipo de Reporte</Label>
              <Select value={selectedReportType} onValueChange={(value) => {
                setSelectedReportType(value as ReportType | "");
                if (value !== "store") setSelectedStoreId("");
                if (value !== "specific_products") setSelectedProductTypeIdsForFilter([]);
                setReportText("");
              }}>
                <SelectTrigger id="report-type-select">
                  <SelectValue placeholder="Selecciona un tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (Todas las Tiendas)</SelectItem>
                  <SelectItem value="store">Por Tienda Específica</SelectItem>
                  <SelectItem value="specific_products">Por Producto(s) Específico(s)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            { (selectedReportType === "store" || selectedReportType === "specific_products") && (
              <div>
                <Label htmlFor="store-select">Filtrar por Tienda (Opcional para Prod. Específicos)</Label>
                <Select value={selectedStoreId} onValueChange={(value) => {
                    setSelectedStoreId(value === "all_stores_for_prod_filter" ? "" : value);
                    setReportText("");
                }}>
                  <SelectTrigger id="store-select">
                    <SelectValue placeholder={selectedReportType === "specific_products" ? "Todas las tiendas (para productos sel.)" : "Selecciona una tienda..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedReportType === "specific_products" && <SelectItem value="all_stores_for_prod_filter">Todas las tiendas (para productos sel.)</SelectItem>}
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
            
          {selectedReportType === "specific_products" && (
            <div className="space-y-2 pt-2">
                <Label htmlFor="product-filter-combobox">Seleccionar Tipos de Producto</Label>
                {productTypes.length === 0 ? (
                    <Input placeholder="No hay tipos de producto para seleccionar" disabled className="cursor-not-allowed bg-muted/50" />
                ) : (
                <Popover open={productFilterComboboxOpen} onOpenChange={setProductFilterComboboxOpen}>
                    <PopoverTrigger asChild>
                    <Button
                        id="product-filter-combobox"
                        variant="outline"
                        role="combobox"
                        aria-expanded={productFilterComboboxOpen}
                        className="w-full justify-between font-normal min-h-10 h-auto py-1.5"
                    >
                        <div className="flex flex-wrap gap-1 items-center">
                            {selectedProductNames.length === 0 ? "Selecciona producto(s)..." :
                            selectedProductNames.map(name => (
                                <Badge key={name} variant="secondary" className="px-1.5 py-0.5">
                                    {name}
                                </Badge>
                            ))
                            }
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar tipo de producto..." />
                        <CommandList>
                            <CommandEmpty>No se encontró el tipo de producto.</CommandEmpty>
                            <CommandGroup>
                            {productTypes.map((pt) => (
                                <CommandItem
                                key={pt.id}
                                value={`${pt.brand} ${pt.model}`}
                                onSelect={() => {
                                    handleProductTypeToggle(pt.id);
                                    // Keep popover open for multi-select
                                    // setProductFilterComboboxOpen(false); 
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProductTypeIdsForFilter.includes(pt.id) ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {pt.brand} {pt.model}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                    </PopoverContent>
                </Popover>
                )}
            </div>
          )}


          <div className="space-y-2 pt-2">
            <Label className="text-base font-medium">Campos a Incluir en Detalles del Artículo:</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 p-2 border rounded-md bg-muted/20">
                {fieldCheckbox("imei", REPORT_FIELD_LABELS.imei)}
                {fieldCheckbox("product", REPORT_FIELD_LABELS.product)}
                {fieldCheckbox("memory", REPORT_FIELD_LABELS.memory)}
                {fieldCheckbox("color", REPORT_FIELD_LABELS.color)}
                {fieldCheckbox("store", REPORT_FIELD_LABELS.store)}
                {fieldCheckbox("status", REPORT_FIELD_LABELS.status)}
                {fieldCheckbox("price", REPORT_FIELD_LABELS.price)}
            </div>
             <p className="text-xs text-muted-foreground pt-1">
                Nota: IMEI y Producto (Marca/Modelo) siempre se muestran como parte de la estructura base del reporte.
                La Tienda se muestra como encabezado en el reporte general o si se filtra por productos en todas las tiendas.
                El estatus siempre reflejará el estado activo del artículo en este reporte.
            </p>
          </div>

           <Button
            onClick={generateReport}
            disabled={!selectedReportType || (selectedReportType === "store" && !selectedStoreId) || (selectedReportType === "specific_products" && selectedProductTypeIdsForFilter.length === 0)}
            className="w-full md:w-auto mt-2"
          >
            Generar Reporte
          </Button>

          {reportText && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="report-output">Reporte Generado:</Label>
                <Button
                  onClick={handleCopyToClipboard}
                  variant="outline"
                  size="sm"
                >
                  <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar Reporte
                </Button>
              </div>
              <ScrollArea className="border rounded-md bg-muted/20">
                <Textarea
                  id="report-output"
                  readOnly
                  value={reportText}
                  className="h-64 w-full text-xs font-mono bg-muted/30 p-2 focus:ring-0 focus:outline-none resize-none"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </ScrollArea>
            </div>
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

