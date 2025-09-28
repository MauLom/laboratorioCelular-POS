
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
import { Trash2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DeleteItemConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (password: string) => void;
  selectedItemCount: number;
  requiredPassword?: string; 
}

export function DeleteItemConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  selectedItemCount,
  requiredPassword,
}: DeleteItemConfirmationDialogProps) {
  const { toast } = useToast();
  const [showPasswordError, setShowPasswordError] = useState(false);

  const deleteConfirmationSchema = z.object({
    password: z.string().min(1, { message: "La contraseña es obligatoria." }),
  });
  
  type DeleteConfirmationFormValues = z.infer<typeof deleteConfirmationSchema>;

  const form = useForm<DeleteConfirmationFormValues>({
    resolver: zodResolver(deleteConfirmationSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ password: "" });
      setShowPasswordError(false);
    }
  }, [isOpen, form]);

  const onSubmit = (data: DeleteConfirmationFormValues) => {
    if (requiredPassword && data.password !== requiredPassword) {
      setShowPasswordError(true);
      toast({
        title: "Contraseña Incorrecta",
        description: "La contraseña ingresada no es válida. No se eliminaron artículos.",
        variant: "destructive",
      });
      return;
    }
    setShowPasswordError(false);
    onConfirm(data.password);
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
          <DialogTitle className="flex items-center text-destructive">
            <ShieldAlert className="mr-2 h-5 w-5" />
            Confirmar Eliminación de Artículos
          </DialogTitle>
          <DialogDescription>
            Estás a punto de eliminar permanentemente {selectedItemCount} artículo(s) del inventario.
            Esta acción no se puede deshacer. Ingresa la contraseña de administrador para confirmar.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña de Administrador</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Ingresa la contraseña" 
                      {...field} 
                      className={showPasswordError ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                  {showPasswordError && (
                    <p className="text-sm font-medium text-destructive">
                      La contraseña proporcionada es incorrecta.
                    </p>
                  )}
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar {selectedItemCount} Artículo(s)
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

