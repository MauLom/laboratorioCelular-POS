
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CalendarIcon, ListPlus, PlusCircle, XCircle, Check, ChevronsUpDown, ClipboardPaste } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ProductType, Store, InventoryItem, ItemStatus } from "@/types/inventory";
import { ITEM_STATUSES } from "@/types/inventory";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddMultipleItems: (items: InventoryItem[]) => void;
  productTypes: ProductType[];
  stores: Store[];
  existingImeis: string[];
}

const commonItemDataSchema = z.object({
  productTypeId: z.string().min(1, { message: "El tipo de producto es obligatorio." }),
  memory: z.string().min(1, { message: "La memoria es obligatoria." }),
  color: z.string().optional(),
  supplier: z.string().min(1, { message: "El proveedor es obligatorio." }),
  purchasePrice: z.coerce.number().positive({ message: "El precio de compra debe ser un número positivo." }),
  purchaseInvoiceId: z.string().min(1, { message: "El ID de la factura de compra es obligatorio." }),
  purchaseInvoiceDate: z.date({ required_error: "La fecha de la factura de compra es obligatoria."}),
  storeId: z.string().min(1, { message: "La tienda es obligatoria." }),
  status: z.enum(ITEM_STATUSES, { required_error: "El estatus es obligatorio."}),
});

type CommonItemDataValues = z.infer<typeof commonItemDataSchema>;

interface ImeiEntry {
  id: string;
  imei: string;
  imei2?: string;
}

const normalizeString = (str: string | undefined | null): string => {
  if (!str) return "";
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
};

export function AddItemDialog({
  isOpen,
  onOpenChange,
  onAddMultipleItems,
  productTypes,
  stores,
  existingImeis,
}: AddItemDialogProps) {
  const { toast } = useToast();
  const [selectedProductTypeDetails, setSelectedProductTypeDetails] = useState<{brand: string, model: string} | null>(null);

  const [productTypeComboboxOpen, setProductTypeComboboxOpen] = useState(false);
  const [storeComboboxOpen, setStoreComboboxOpen] = useState(false);
  const [statusComboboxOpen, setStatusComboboxOpen] = useState(false);

  const [imeiEntries, setImeiEntries] = useState<ImeiEntry[]>([]);
  const [currentImei, setCurrentImei] = useState("");
  const [currentImei2, setCurrentImei2] = useState("");
  const [bulkImeiText, setBulkImeiText] = useState("");

  const form = useForm<CommonItemDataValues>({
    resolver: zodResolver(commonItemDataSchema),
    defaultValues: {
      productTypeId: "",
      memory: "",
      color: "",
      supplier: "",
      purchasePrice: "" as unknown as number,
      purchaseInvoiceId: "",
      purchaseInvoiceDate: undefined,
      storeId: "",
      status: "Nuevo",
    },
  });

  const watchedProductTypeId = form.watch("productTypeId");

  useEffect(() => {
    if (watchedProductTypeId) {
      const product = productTypes.find(p => p.id === watchedProductTypeId);
      setSelectedProductTypeDetails(product ? { brand: product.brand, model: product.model } : null);
    } else {
      setSelectedProductTypeDetails(null);
    }
  }, [watchedProductTypeId, productTypes]);

  useEffect(() => {
    if (isOpen) {
      form.reset();
      setSelectedProductTypeDetails(null);
      setImeiEntries([]);
      setCurrentImei("");
      setCurrentImei2("");
      setBulkImeiText("");
      setProductTypeComboboxOpen(false);
      setStoreComboboxOpen(false);
      setStatusComboboxOpen(false);
    }
  }, [isOpen, form]);

  const handleAddImeiToList = () => {
    const trimmedImei = currentImei.trim();
    const trimmedImei2 = currentImei2.trim();

    if (!trimmedImei) {
      toast({ title: "Error", description: "El IMEI principal no puede estar vacío.", variant: "destructive" });
      return;
    }
    if (trimmedImei.length < 10) {
      toast({ title: "Error", description: "El IMEI principal debe tener al menos 10 caracteres.", variant: "destructive" });
      return;
    }
    if (existingImeis.includes(trimmedImei) || imeiEntries.some(e => e.imei === trimmedImei)) {
      toast({ title: "Error", description: "Este IMEI principal ya existe en el inventario o en la lista actual.", variant: "destructive" });
      return;
    }
    if (trimmedImei2 && trimmedImei2.length < 10) {
        toast({ title: "Error", description: "El IMEI 2 debe tener al menos 10 caracteres si se proporciona.", variant: "destructive" });
        return;
    }
     if (trimmedImei2 && (existingImeis.includes(trimmedImei2) || imeiEntries.some(e => e.imei2 === trimmedImei2))) {
      toast({ title: "Error", description: "Este IMEI 2 ya existe en el inventario o en la lista actual.", variant: "destructive" });
      return;
    }

    setImeiEntries(prev => [...prev, { id: crypto.randomUUID(), imei: trimmedImei, imei2: trimmedImei2 || undefined }]);
    setCurrentImei("");
    setCurrentImei2("");
    toast({ title: "IMEI Añadido", description: "El par de IMEI ha sido añadido a la lista."});
  };

  const handleRemoveImeiFromList = (idToRemove: string) => {
    setImeiEntries(prev => prev.filter(entry => entry.id !== idToRemove));
  };

  const handlePasteImeis = () => {
    if (!bulkImeiText.trim()) {
      toast({ title: "Entrada Vacía", description: "Pega la lista de IMEIs en el área de texto.", variant: "destructive"});
      return;
    }

    const imeiRegex = /\b\d{10,20}\b/g;
    const potentialImeis = bulkImeiText.match(imeiRegex) || [];
    const uniquePastedImeis = Array.from(new Set(potentialImeis));

    let addedCount = 0;
    let duplicateInInventoryCount = 0;
    let duplicateInCurrentListCount = 0;
    let invalidLengthCount = 0;

    const newEntries: ImeiEntry[] = [];

    uniquePastedImeis.forEach(pastedImei => {
      const trimmedPastedImei = pastedImei.trim();
      if (trimmedPastedImei.length < 10) {
        invalidLengthCount++;
        return;
      }
      if (existingImeis.includes(trimmedPastedImei)) {
        duplicateInInventoryCount++;
        return;
      }
      if (imeiEntries.some(e => e.imei === trimmedPastedImei)) {
        duplicateInCurrentListCount++;
        return;
      }
      newEntries.push({ id: crypto.randomUUID(), imei: trimmedPastedImei, imei2: undefined });
      addedCount++;
    });

    if (newEntries.length > 0) {
      setImeiEntries(prev => [...prev, ...newEntries]);
    }

    let summary = `${addedCount} IMEI(s) añadidos a la lista.`;
    if (invalidLengthCount > 0) summary += ` ${invalidLengthCount} inválido(s) (longitud).`;
    if (duplicateInInventoryCount > 0) summary += ` ${duplicateInInventoryCount} ya en inventario.`;
    if (duplicateInCurrentListCount > 0) summary += ` ${duplicateInCurrentListCount} ya en esta lista.`;

    toast({
      title: "Procesamiento de IMEIs Pegados Completo",
      description: summary,
      duration: 7000,
    });
    setBulkImeiText("");
  };

  const onSubmit = (data: CommonItemDataValues) => {
    if (imeiEntries.length === 0) {
      toast({ title: "Error", description: "Debes añadir al menos un IMEI a la lista.", variant: "destructive" });
      return;
    }
     if (!data.productTypeId && productTypes.length > 0) {
      toast({ title: "Error", description: "Debes seleccionar un tipo de producto.", variant: "destructive" });
      form.setError("productTypeId", {type: "manual", message: "El tipo de producto es obligatorio."});
      return;
    }
    if (productTypes.length === 0 && !data.productTypeId) {
      toast({ title: "Error", description: "No hay tipos de producto. Registra uno primero.", variant: "destructive" });
      return;
    }

    const itemsToAdd: InventoryItem[] = imeiEntries.map(entry => ({
      ...data,
      imei: entry.imei,
      imei2: entry.imei2,
      color: data.color || undefined,
      purchasePrice: Number(data.purchasePrice),
      purchaseInvoiceDate: format(data.purchaseInvoiceDate, "yyyy-MM-dd"),
    }));

    onAddMultipleItems(itemsToAdd);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ListPlus className="mr-2 h-5 w-5" />
            Añadir Artículo(s) a Inventario
          </DialogTitle>
          <DialogDescription>
            Registra los detalles comunes y luego añade los IMEIs para cada artículo, ya sea manual o pegando una lista.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-200px)] pr-3">
          {selectedProductTypeDetails && (
            <div className="mb-3 p-3 border rounded-md bg-secondary/50 text-sm">
              <h4 className="font-semibold mb-1">Tipo de Producto Seleccionado:</h4>
              <p><strong>Marca:</strong> {selectedProductTypeDetails.brand}</p>
              <p><strong>Modelo:</strong> {selectedProductTypeDetails.model}</p>
            </div>
          )}

          <Form {...form}>
            <form id="common-data-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="productTypeId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tipo de Producto (Marca/Modelo Base)</FormLabel>
                    {productTypes.length === 0 ? (
                      <>
                        <Input
                          placeholder="No hay tipos de producto disponibles"
                          disabled
                          className="mt-1 cursor-not-allowed bg-muted/50"
                        />
                        <p className="text-xs text-muted-foreground pt-1">
                          Aún no has registrado ningún tipo de producto. Por favor, usa la opción "Registrar Tipo de Producto" primero.
                        </p>
                      </>
                    ) : (
                      <Popover open={productTypeComboboxOpen} onOpenChange={setProductTypeComboboxOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={productTypeComboboxOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? (() => {
                                    const product = productTypes.find(pt => pt.id === field.value);
                                    return product ? `${product.brand} ${product.model}` : "Selecciona o escribe tipo de producto...";
                                  })()
                                : "Selecciona o escribe tipo de producto..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar tipo de producto..." />
                            <CommandEmpty>No se encontró el tipo de producto.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {productTypes.map((pt) => (
                                  <CommandItem
                                    value={`${pt.brand} ${pt.model}`}
                                    key={pt.id}
                                    onSelect={(currentValue) => {
                                      const normalizedCurrentValue = normalizeString(currentValue);
                                      const selectedProduct = productTypes.find(p => {
                                        const productString = `${p.brand} ${p.model}`;
                                        return normalizeString(productString) === normalizedCurrentValue;
                                      });

                                      if (selectedProduct) {
                                        form.setValue("productTypeId", selectedProduct.id);
                                      } else if (currentValue === "") {
                                        form.setValue("productTypeId", "");
                                      }
                                      setProductTypeComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === pt.id ? "opacity-100" : "opacity-0"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="memory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 256GB" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color <span className="text-xs text-muted-foreground">(Opcional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Azul Medianoche" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: TechSupplier Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio de Compra (Unitario)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ej: 750.00"
                          {...field}
                          onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          value={field.value === null || field.value === undefined ? '' : String(field.value)}
                          onWheel={(event) => (event.target as HTMLInputElement).blur()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purchaseInvoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Factura de Compra</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: INV-2023-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="purchaseInvoiceDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Factura de Compra</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="storeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignar a Tienda</FormLabel>
                       <Popover open={storeComboboxOpen} onOpenChange={setStoreComboboxOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={storeComboboxOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? stores.find(s => s.id === field.value)?.name
                                : "Selecciona una tienda"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar tienda..." />
                            <CommandEmpty>No se encontró la tienda.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {stores.map((store) => (
                                  <CommandItem
                                    value={store.name}
                                    key={store.id}
                                    onSelect={(currentValue) => {
                                      const selectedStore = stores.find(s => normalizeString(s.name) === normalizeString(currentValue));
                                      if (selectedStore) {
                                        form.setValue("storeId", selectedStore.id);
                                      } else if (currentValue === "") {
                                        form.setValue("storeId", "");
                                      }
                                      setStoreComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === store.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {store.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estatus Inicial</FormLabel>
                       <Popover open={statusComboboxOpen} onOpenChange={setStatusComboboxOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={statusComboboxOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || "Selecciona un estatus"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar estatus..." />
                            <CommandEmpty>No se encontró el estatus.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {ITEM_STATUSES.map((statusValue) => (
                                  <CommandItem
                                    value={statusValue}
                                    key={statusValue}
                                    onSelect={(currentValue) => {
                                      form.setValue("status", currentValue as ItemStatus);
                                      setStatusComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === statusValue ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {statusValue}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>

          <div className="my-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-3">
              <h4 className="text-md font-semibold">Añadir IMEI Manualmente</h4>
              <div className="space-y-1">
                <Label htmlFor="current-imei">IMEI Principal Actual</Label>
                <Input
                  id="current-imei"
                  placeholder="Introduce el IMEI principal"
                  value={currentImei}
                  onChange={(e) => setCurrentImei(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="current-imei2">IMEI 2 Actual (Opcional)</Label>
                <Input
                  id="current-imei2"
                  placeholder="Introduce el IMEI secundario"
                  value={currentImei2}
                  onChange={(e) => setCurrentImei2(e.target.value)}
                />
              </div>
              <Button onClick={handleAddImeiToList} type="button" variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir IMEI a la Lista
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="text-md font-semibold">Pegar Lista de IMEIs (Principales)</h4>
              <div>
                <Label htmlFor="bulk-imei-text">Pegar aquí (un IMEI por línea o separados):</Label>
                <Textarea
                  id="bulk-imei-text"
                  placeholder="123456789012345&#10;987654321098765&#10;..."
                  value={bulkImeiText}
                  onChange={(e) => setBulkImeiText(e.target.value)}
                  rows={4}
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <Button onClick={handlePasteImeis} type="button" variant="outline" size="sm">
                  <ClipboardPaste className="mr-2 h-4 w-4" />
                  Procesar y Añadir IMEIs Pegados
              </Button>
            </div>
          </div>


          {imeiEntries.length > 0 && (
            <div className="pt-2">
              <h5 className="text-sm font-medium mb-1">IMEIs a Registrar ({imeiEntries.length}):</h5>
              <ScrollArea className="h-32 border rounded-md p-2 bg-muted/30">
                <ul className="space-y-1">
                  {imeiEntries.map((entry) => (
                    <li key={entry.id} className="flex justify-between items-center text-xs p-1 bg-background rounded shadow-sm">
                      <span>IMEI: {entry.imei}{entry.imei2 ? `, IMEI2: ${entry.imei2}` : ''}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveImeiFromList(entry.id)}>
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
           {imeiEntries.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">No hay IMEIs en la lista para registrar.</p>
           )}
        </ScrollArea>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="common-data-form"
            disabled={imeiEntries.length === 0 || (productTypes.length === 0 && !form.getValues("productTypeId")) }
          >
            Añadir {imeiEntries.length > 0 ? `${imeiEntries.length} Artículo(s)` : 'Artículo(s)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
