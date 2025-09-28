"use client";

import { Button } from "@/components/ui/button";

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkChangeStatus: () => void;
  onBulkTransfer: () => void;
  onBulkDelete: () => void;
  onOpenBulkSelectByImei: () => void;
  onShowDetails: () => void;
  disabled?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onBulkChangeStatus,
  onBulkTransfer,
  onBulkDelete,
  onOpenBulkSelectByImei,
  onShowDetails,
  disabled = false,
}: BulkActionsBarProps) {
  const isActionDisabled = disabled || selectedCount === 0;
  const isSelectionViaListDisabled = disabled;

  return (
    <div className="my-4 p-3 border rounded-lg bg-white shadow-sm flex items-center justify-between flex-wrap gap-2">
      <div>
        {selectedCount > 0 ? (
          <p className="text-sm font-medium">
            {selectedCount} artículo(s) seleccionado(s)
          </p>
        ) : (
          <p className="text-sm text-gray-600">
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
          <span className="mr-2">📝</span>
          Selección Rápida por IMEIs
        </Button>
        <Button
          onClick={onShowDetails}
          disabled={isActionDisabled}
          variant="outline"
          size="sm"
        >
          <span className="mr-2">ℹ️</span>
          Ver Detalles
        </Button>
        <Button
          onClick={onBulkChangeStatus}
          disabled={isActionDisabled}
          variant="outline"
          size="sm"
        >
          <span className="mr-2">✏️</span>
          Cambiar Estado
        </Button>
        <Button
          onClick={onBulkTransfer}
          disabled={isActionDisabled}
          variant="outline"
          size="sm"
        >
          <span className="mr-2">↔️</span>
          Transferir
        </Button>
        <Button
          onClick={onBulkDelete}
          disabled={isActionDisabled}
          variant="destructive"
          size="sm"
        >
          <span className="mr-2">🗑️</span>
          Eliminar
        </Button>
      </div>
    </div>
  );
}