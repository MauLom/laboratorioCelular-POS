
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ListChecks, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BulkSelectByImeiDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onImeisProcessed: (imeis: string[]) => void;
  allInventoryImeis: string[];
}

export function BulkSelectByImeiDialog({
  isOpen,
  onOpenChange,
  onImeisProcessed,
  allInventoryImeis,
}: BulkSelectByImeiDialogProps) {
  const [imeiInputText, setImeiInputText] = useState("");
  const [processedInfo, setProcessedInfo] = useState<{
    foundInText: number;
    validAndExisting: number;
    notFoundInInventory: string[];
    duplicatesInInput: string[];
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setImeiInputText("");
      setProcessedInfo(null);
    }
  }, [isOpen]);

  const handleProcessImeis = () => {
    if (!imeiInputText.trim()) {
      toast({
        title: "Entrada Vacía",
        description: "Por favor, pega la lista de IMEIs en el área de texto.",
        variant: "destructive",
      });
      return;
    }

    const imeiRegex = /\b\d{10,20}\b/g;
    const potentialImeis = imeiInputText.match(imeiRegex) || [];
    
    const uniquePotentialImeis = Array.from(new Set(potentialImeis));
    const duplicatesInInput = potentialImeis.filter((item, index) => potentialImeis.indexOf(item) !== index);

    const validAndExistingImeis = uniquePotentialImeis.filter(imei =>
      allInventoryImeis.includes(imei)
    );
    
    const notFoundInInventory = uniquePotentialImeis.filter(imei => 
        !allInventoryImeis.includes(imei)
    );

    setProcessedInfo({
        foundInText: uniquePotentialImeis.length,
        validAndExisting: validAndExistingImeis.length,
        notFoundInInventory: notFoundInInventory,
        duplicatesInInput: Array.from(new Set(duplicatesInInput)),
    });

    if (validAndExistingImeis.length > 0) {
        // Defer calling onImeisProcessed to allow user to see the info
    } else {
      toast({
        title: "No se Encontraron IMEIs Válidos",
        description: "Ninguno de los IMEIs procesados existe en el inventario o la lista estaba vacía/malformada.",
        variant: "default",
      });
    }
  };

  const handleConfirmSelection = () => {
    if (processedInfo && processedInfo.validAndExisting > 0) {
        const validImeisToPass = Array.from(new Set(imeiInputText.match(/\b\d{10,20}\b/g) || [])).filter(imei => allInventoryImeis.includes(imei));
        onImeisProcessed(validImeisToPass);
    } else {
         onImeisProcessed([]); 
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ListChecks className="mr-2 h-5 w-5" />
            Selección Rápida por Lista de IMEIs
          </DialogTitle>
          <DialogDescription>
            Pega tu lista de IMEIs abajo. El sistema intentará extraerlos y seleccionarlos del inventario.
            Se buscarán números de 10 a 20 dígitos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1 py-2 space-y-3"> {/* Adjusted padding slightly from default dialog to fit better */}
          <div>
            <Label htmlFor="imei-list-textarea">Lista de IMEIs:</Label>
            <Textarea
              id="imei-list-textarea"
              placeholder="Pega aquí tu texto con los IMEIs... Ejemplo: IMEI1: 123456789012345, OtroTexto IMEI2 987654321098765 etc."
              value={imeiInputText}
              onChange={(e) => setImeiInputText(e.target.value)}
              rows={5} // Reduced rows from 6
              className="font-mono text-xs mt-1"
            />
          </div>
           <Button onClick={handleProcessImeis} className="w-full sm:w-auto">
            Procesar Lista
          </Button>
       
          {processedInfo && (
              <div className="mt-3 p-3 border rounded-md bg-muted/50 text-sm space-y-2">
                  <h4 className="font-semibold">Resultados del Procesamiento:</h4>
                  <p>IMEIs únicos encontrados en el texto: {processedInfo.foundInText}</p>
                  <p className="text-green-600">IMEIs válidos y existentes en inventario: {processedInfo.validAndExisting}</p>
                  {processedInfo.duplicatesInInput.length > 0 && (
                       <p className="text-orange-600">IMEIs duplicados en la entrada (se contarán una vez): {processedInfo.duplicatesInInput.length} ({processedInfo.duplicatesInInput.slice(0,5).join(', ')}{processedInfo.duplicatesInInput.length > 5 ? '...' : ''})</p>
                  )}
                  {processedInfo.notFoundInInventory.length > 0 && (
                      <div>
                          <p className="text-red-600">IMEIs no encontrados en inventario ({processedInfo.notFoundInInventory.length}):</p>
                          <ScrollArea className="h-20 mt-1 border rounded p-1.5 bg-background text-xs">
                              <ul className="list-disc list-inside">
                                  {processedInfo.notFoundInInventory.map(imei => <li key={imei}>{imei}</li>)}
                              </ul>
                          </ScrollArea>
                      </div>
                  )}
                   {processedInfo.validAndExisting === 0 && processedInfo.foundInText > 0 && (
                      <p className="text-destructive font-semibold mt-2">
                          <AlertTriangle className="inline h-4 w-4 mr-1"/> Ninguno de los IMEIs encontrados en el texto existe en el inventario.
                      </p>
                  )}
              </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirmSelection}
            disabled={!processedInfo || processedInfo.validAndExisting === 0}
          >
            Confirmar Selección ({processedInfo?.validAndExisting || 0}) y Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

