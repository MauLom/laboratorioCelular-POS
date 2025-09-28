
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import type { ItemStatus } from "@/types/inventory";
import { ITEM_STATUSES } from "@/types/inventory";
import { useEffect } from "react";

interface BulkChangeStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (newStatus: ItemStatus) => void;
  selectedItemCount: number;
}

const bulkStatusChangeSchema = z.object({
  status: z.enum(ITEM_STATUSES, { required_error: "El estatus es obligatorio." }),
});

type BulkStatusChangeFormValues = z.infer<typeof bulkStatusChangeSchema>;

export function BulkChangeStatusDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  selectedItemCount,
}: BulkChangeStatusDialogProps) {
  
  const form = useForm<BulkStatusChangeFormValues>({
    resolver: zodResolver(bulkStatusChangeSchema),
    defaultValues: {
      status: "Nuevo",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        status: "Nuevo", 
      });
    }
  }, [isOpen, form]);

  const onSubmit = (data: BulkStatusChangeFormValues) => {
    onConfirm(data.status);
    onOpenChange(false);
  };

  if (selectedItemCount === 0 && isOpen) {
    onOpenChange(false);
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Pencil className="mr-2 h-5 w-5" />
            Cambiar Estatus de Artículos Seleccionados
          </DialogTitle>
          <DialogDescription>
            Selecciona un nuevo estatus para los {selectedItemCount} artículo(s) seleccionado(s).
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuevo Estatus</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estatus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ITEM_STATUSES.map((statusValue) => (
                        <SelectItem key={statusValue} value={statusValue}>
                          {statusValue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Aplicar Estatus</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
