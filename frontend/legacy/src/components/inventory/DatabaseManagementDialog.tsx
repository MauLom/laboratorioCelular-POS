
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Database, Download, Upload } from "lucide-react";
import React, { useRef } from "react";

interface DatabaseManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDownloadBackup: () => void;
  onUploadBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DatabaseManagementDialog({
  isOpen,
  onOpenChange,
  onDownloadBackup,
  onUploadBackup,
}: DatabaseManagementDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5 text-primary" />
            Gestionar Base de Datos (Local)
          </DialogTitle>
          <DialogDescription>
            Descarga un backup de tus datos actuales o carga un backup previo.
            Esta operación afecta solo los datos guardados en este navegador.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Button onClick={onDownloadBackup} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Descargar Backup Actual
          </Button>
          <div>
            <Button onClick={handleUploadClick} variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Cargar Backup desde Archivo
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={onUploadBackup}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Selecciona un archivo <code>.json</code> previamente descargado. <br />
              <strong>Advertencia:</strong> Esto reemplazará todos los datos actuales.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
