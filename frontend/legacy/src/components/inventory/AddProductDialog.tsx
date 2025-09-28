
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
import type { ProductType } from "@/types/inventory";
import { PackagePlus } from "lucide-react";

const productFormSchema = z.object({
  brand: z.string().min(1, { message: "La marca es obligatoria." }),
  model: z.string().min(1, { message: "El modelo es obligatorio." }),
  minimumStock: z.coerce
    .number({invalid_type_error: "Debe ser un número." })
    .int({ message: "Debe ser un número entero." })
    .min(0, { message: "Debe ser 0 o mayor." })
    .optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddProduct: (product: Omit<ProductType, "id">) => void;
}

export function AddProductDialog({
  isOpen,
  onOpenChange,
  onAddProduct,
}: AddProductDialogProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      brand: "",
      model: "",
      minimumStock: undefined,
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    onAddProduct({
      brand: data.brand,
      model: data.model,
      minimumStock: data.minimumStock,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PackagePlus className="mr-2 h-5 w-5" />
            Registrar Nuevo Tipo de Producto
          </DialogTitle>
          <DialogDescription>
            Añade la marca, modelo y opcionalmente el stock mínimo necesario.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Samsung" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Galaxy A05" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minimumStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Mínimo Necesario <span className="text-xs text-muted-foreground">(Opcional)</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ej: 5" 
                      {...field} 
                      onChange={e => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : parseInt(value, 10));
                      }}
                      value={field.value === undefined ? '' : String(field.value)}
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Añadir Tipo de Producto</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
