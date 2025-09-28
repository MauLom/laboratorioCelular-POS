
"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProductType } from "@/types/inventory";
import { AlertTriangle, Recycle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReassignItemsBeforeDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productToDelete: ProductType | null;
  itemCountToReassign: number;
  availableProductTypes: ProductType[]; // Product types EXCLUDING the one to be deleted
  onConfirmReassignment: (targetProductTypeId: string) => void;
}

export function ReassignItemsBeforeDeleteDialog({
  isOpen,
  onOpenChange,
  productToDelete,
  itemCountToReassign,
  availableProductTypes,
  onConfirmReassignment,
}: ReassignItemsBeforeDeleteDialogProps) {
  const [selectedTargetProductId, setSelectedTargetProductId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedTargetProductId(""); // Reset selection when dialog opens
    }
  }, [isOpen]);

  if (!productToDelete) return null;

  const handleConfirm = () => {
    if (!selectedTargetProductId) {
      toast({
        title: "Selección Requerida",
        description: "Debes seleccionar un nuevo tipo de producto para reasignar los artículos.",
        variant: "destructive",
      });
      return;
    }
    onConfirmReassignment(selectedTargetProductId);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Reasignar Artículos Antes de Eliminar
          </DialogTitle>
          <DialogDescription>
            El tipo de producto "{productToDelete.brand} {productToDelete.model}" tiene {itemCountToReassign} artículo(s) asociado(s).
            Debes reasignarlos a otro tipo de producto antes de poder eliminarlo.
          </DialogDescription>
        </DialogHeader>

        {availableProductTypes.length === 0 ? (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No hay otros tipos de producto</AlertTitle>
            <AlertDescription>
              No hay otros tipos de producto disponibles para reasignar los artículos.
              Por favor, crea un nuevo tipo de producto o elimina los artículos asociados manualmente
              antes de intentar eliminar "{productToDelete.brand} {productToDelete.model}".
            </AlertDescription>
          </Alert>
        ) : (
          <div className="py-4 space-y-3">
            <Label htmlFor="target-product-select">Reasignar artículos a:</Label>
            <Select value={selectedTargetProductId} onValueChange={setSelectedTargetProductId}>
              <SelectTrigger id="target-product-select">
                <SelectValue placeholder="Selecciona un nuevo tipo de producto..." />
              </SelectTrigger>
              <SelectContent>
                {availableProductTypes.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.brand} {pt.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             <p className="text-xs text-muted-foreground">
              Se reasignarán {itemCountToReassign} artículo(s) del tipo "{productToDelete.brand} {productToDelete.model}".
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={availableProductTypes.length === 0 || !selectedTargetProductId}
          >
            <Recycle className="mr-2 h-4 w-4" />
            Reasignar y Eliminar Tipo de Producto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
