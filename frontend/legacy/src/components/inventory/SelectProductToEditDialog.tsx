
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
import type { ProductType } from "@/types/inventory";
import { PencilLine, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SelectProductToEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productTypes: ProductType[];
  onProductSelected: (product: ProductType) => void;
  onProductSelectedForDelete: (product: ProductType) => void; // Nueva prop
}

export function SelectProductToEditDialog({
  isOpen,
  onOpenChange,
  productTypes,
  onProductSelected,
  onProductSelectedForDelete,
}: SelectProductToEditDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedProductId(""); 
    }
  }, [isOpen]);

  const handleConfirmEdit = () => {
    if (!selectedProductId) {
      toast({
        title: "Selección Requerida",
        description: "Por favor, selecciona un tipo de producto para editar.",
        variant: "destructive",
      });
      return;
    }
    const productToEdit = productTypes.find(pt => pt.id === selectedProductId);
    if (productToEdit) {
      onProductSelected(productToEdit);
      // onOpenChange(false); // Se cierra desde page.tsx al abrir el siguiente diálogo
    } else {
      toast({
        title: "Error",
        description: "El producto seleccionado no fue encontrado.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedProductId) {
      toast({
        title: "Selección Requerida",
        description: "Por favor, selecciona un tipo de producto para eliminar.",
        variant: "destructive",
      });
      return;
    }
    const productToDelete = productTypes.find(pt => pt.id === selectedProductId);
    if (productToDelete) {
      onProductSelectedForDelete(productToDelete);
      // onOpenChange(false); // Se cierra desde page.tsx al abrir el siguiente diálogo
    } else {
      toast({
        title: "Error",
        description: "El producto seleccionado no fue encontrado.",
        variant: "destructive",
      });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PencilLine className="mr-2 h-5 w-5" />
            Seleccionar Tipo de Producto
          </DialogTitle>
          <DialogDescription>
            Elige el tipo de producto que deseas modificar o eliminar de la lista.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="product-select">Tipo de Producto</Label>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger id="product-select">
              <SelectValue placeholder="Selecciona un tipo de producto..." />
            </SelectTrigger>
            <SelectContent>
              {productTypes.map((pt) => (
                <SelectItem key={pt.id} value={pt.id}>
                  {pt.brand} {pt.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleConfirmDelete} 
              disabled={!selectedProductId}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirmEdit} 
              disabled={!selectedProductId}
            >
              Editar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

