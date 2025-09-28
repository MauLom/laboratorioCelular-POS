
"use client";

import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Pencil, Trash2, ListChecks, Info } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkChangeStatus: () => void;
  onBulkTransfer: () => void;
  onBulkDelete: () => void;
  onOpenBulkSelectByImei: () => void;
  onShowDetails: () => void; // New prop for showing details
  disabled?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onBulkChangeStatus,
  onBulkTransfer,
  onBulkDelete,
  onOpenBulkSelectByImei,
  onShowDetails, // New prop
  disabled = false,
}: BulkActionsBarProps) {
  const isActionDisabled = disabled || selectedCount === 0;
  const isSelectionViaListDisabled = disabled;

  return (
    <div className="my-4 p-3 border rounded-lg bg-card shadow-sm flex items-center justify-between flex-wrap gap-2">
      <div>
        {selectedCount > 0 ? (
          <p className="text-sm font-medium">
            {selectedCount} artículo(s) seleccionado(s)
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {disabled ? "Inicia sesión para realizar acciones." : "Selecciona artículos o carga una lista de IMEIs."}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2 flex-wrap gap-2">
        <Button
          onClick={onOpenBulkSelectByImei}
          disabled={isSelectionViaListDisabled}
          variant="outline"
          size="sm"
        >
          <ListChecks className="mr-2 h-4 w-4" />
          Selección Rápida por IMEIs
        </Button>
        <Button
          onClick={onShowDetails}
          disabled={isActionDisabled}
          variant="outline"
          size="sm"
        >
          <Info className="mr-2 h-4 w-4" />
          Mostrar Detalles
        </Button>
        <Button
          onClick={onBulkChangeStatus}
          disabled={isActionDisabled}
          variant="outline"
          size="sm"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Cambiar Estatus
        </Button>
        <Button
          onClick={onBulkTransfer}
          disabled={isActionDisabled}
          variant="outline"
          size="sm"
        >
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transferir
        </Button>
        <Button
          onClick={onBulkDelete}
          disabled={isActionDisabled}
          variant="destructive"
          size="sm"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar Seleccionados
        </Button>
      </div>
    </div>
  );
}
