
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
import type { Store } from "@/types/inventory";
import { ArrowRightLeft } from "lucide-react";
import { useEffect } from "react";

const bulkTransferFormSchema = z.object({
  targetStoreId: z.string().min(1, { message: "La tienda de destino es obligatoria." }),
});

type BulkTransferFormValues = z.infer<typeof bulkTransferFormSchema>;

interface BulkTransferDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (targetStoreId: string) => void;
  selectedItemCount: number;
  stores: Store[];
}

export function BulkTransferDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  selectedItemCount,
  stores,
}: BulkTransferDialogProps) {
  const form = useForm<BulkTransferFormValues>({
    resolver: zodResolver(bulkTransferFormSchema),
    defaultValues: {
      targetStoreId: "",
    }
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ targetStoreId: "" });
    }
  }, [isOpen, form]);

  const onSubmit = (data: BulkTransferFormValues) => {
    onConfirm(data.targetStoreId);
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
            <ArrowRightLeft className="mr-2 h-5 w-5" />
            Transferir Artículos Seleccionados
          </DialogTitle>
          <DialogDescription>
            Selecciona la tienda de destino para los {selectedItemCount} artículo(s) seleccionado(s).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="targetStoreId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tienda de Destino</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una tienda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
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
              <Button type="submit">Transferir Artículos</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

