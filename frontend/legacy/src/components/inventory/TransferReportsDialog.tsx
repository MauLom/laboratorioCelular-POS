
"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { LogEntry, User, LogEntryDetails_ITEMS_TRANSFERRED } from "@/types/inventory";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClipboardList, ClipboardCopy, CheckCircle, Clock, UserCheck, ShieldCheck, FileText, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransferReportsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  logs: LogEntry[];
  currentUser: User | null;
  onConfirmReception: (logId: string, confirmationType: 'admin' | 'consultas') => void;
  onCancelTransfer: (logId: string) => void;
}

export function TransferReportsDialog({
    isOpen,
    onOpenChange,
    logs,
    currentUser,
    onConfirmReception,
    onCancelTransfer,
}: TransferReportsDialogProps) {
  const { toast } = useToast();

  const displayedTransferLogs = useMemo(() => {
    let filtered = logs.filter(log => {
      if (log.action === "ITEMS_TRANSFERRED") {
        const details = log.details as LogEntryDetails_ITEMS_TRANSFERRED;
        return details.report && details.transferFolio;
      }
      return false;
    }) as LogEntry[];

    if (currentUser?.role === 'consultas') {
      // Consultas users see transfers for their session's store that are not completed or cancelled.
      filtered = filtered.filter(log => {
        const details = log.details as LogEntryDetails_ITEMS_TRANSFERRED;
        return details.targetStoreId === currentUser.storeId && details.transferState !== 'completed' && details.transferState !== 'cancelled';
      });
    }
    // Admins see all transfer logs.

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, currentUser]);


  const handleCopyToClipboard = async (reportText: string) => {
    try {
      await navigator.clipboard.writeText(reportText);
      toast({
        title: "Reporte Copiado",
        description: "El reporte de transferencia ha sido copiado al portapapeles.",
      });
    } catch (err) {
      console.error("Failed to copy report: ", err);
      toast({
        title: "Error al Copiar",
        description: "No se pudo copiar el reporte al portapapeles. Puedes copiarlo manualmente.",
        variant: "destructive",
      });
    }
  };

  const getConfirmationStatusText = (details: LogEntryDetails_ITEMS_TRANSFERRED): string => {
    if (details.transferState === 'completed') {
      let text = "Completado";
      if (details.adminConfirmedBy) text += ` (Admin: ${details.adminConfirmedBy}`;
      if (details.consultasUserConfirmedBy) {
        text += `${details.adminConfirmedBy ? ', ' : ' ('}Consultas: ${details.consultasUserConfirmedBy}`;
      }
      if (details.adminConfirmedBy || details.consultasUserConfirmedBy) text += ')';
      return text;
    }
    if (details.transferState === 'pending_consultas_confirmation') {
        return `Pendiente Consultas (Admin: ${details.adminConfirmedBy || 'N/A'})`;
    }
    if (details.transferState === 'pending_admin_confirmation') {
        return `Pendiente Admin`;
    }
    if (details.transferState === 'cancelled') {
        let text = "Cancelado";
        if (details.cancelledBy) text += ` (Por: ${details.cancelledBy})`;
        return text;
    }

    return `Pendiente (Estado: ${details.transferState})`;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ClipboardList className="mr-2 h-5 w-5" />
            Reportes de Transferencia
          </DialogTitle>
          <DialogDescription>
            {currentUser?.role === 'consultas'
              ? `Aquí se muestran las transferencias pendientes de confirmación para tu tienda seleccionada.`
              : "Aquí se muestran todos los reportes generados durante las transferencias de artículos y su estado de confirmación/cancelación."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-1 flex-grow overflow-hidden">
          {displayedTransferLogs.length === 0 ? (
            <p className="text-center text-muted-foreground mt-8">
              {currentUser?.role === 'consultas'
                ? "No hay transferencias pendientes de confirmación para tu tienda seleccionada en este momento."
                : "No hay reportes de transferencia disponibles."
              }
            </p>
          ) : (
            <ScrollArea className="h-[calc(80vh-160px)] pr-3">
              <ul className="space-y-4">
                {displayedTransferLogs.map((log) => {
                  const details = log.details as LogEntryDetails_ITEMS_TRANSFERRED;

                  const canAdminConfirm = currentUser?.role === 'admin' &&
                                          details.transferState === 'pending_admin_confirmation';

                  const canConsultasConfirm = currentUser?.role === 'consultas' &&
                                              details.targetStoreId === currentUser.storeId &&
                                              !!details.adminConfirmedBy &&
                                              !details.consultasUserConfirmedBy &&
                                              details.transferState === 'pending_consultas_confirmation';

                  const canAdminCancel = currentUser?.role === 'admin' &&
                                         (details.transferState === 'pending_admin_confirmation' || details.transferState === 'pending_consultas_confirmation');


                  let statusBgColor = 'bg-yellow-100';
                  let statusTextColor = 'text-yellow-700';
                  if (details.transferState === 'completed') {
                    statusBgColor = 'bg-green-100';
                    statusTextColor = 'text-green-700';
                  } else if (details.transferState === 'cancelled') {
                    statusBgColor = 'bg-red-100';
                    statusTextColor = 'text-red-700';
                  }

                  return (
                    <li key={log.id} className="p-4 border rounded-md shadow-sm bg-card hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="font-semibold text-primary text-base">
                                Transferencia a: {details.targetStoreName || "Tienda Desconocida"}
                            </span>
                            <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                                <FileText className="mr-1.5 h-3.5 w-3.5" /> Folio: {details.transferFolio}
                            </div>
                            <span className="block text-xs text-muted-foreground mt-0.5">
                                Iniciado por: {details.initiatorUserName || log.user || "Desconocido"} el {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                            </span>
                        </div>
                         <span className={`flex items-center text-sm px-2 py-1 rounded-full ${statusBgColor} ${statusTextColor}`}>
                          {details.transferState === 'completed' && <CheckCircle className="mr-1 h-4 w-4" />}
                          {details.transferState === 'cancelled' && <XCircle className="mr-1 h-4 w-4" />}
                          {(details.transferState === 'pending_admin_confirmation' || details.transferState === 'pending_consultas_confirmation') && <Clock className="mr-1 h-4 w-4" />}
                          {getConfirmationStatusText(details)}
                        </span>
                      </div>

                      {details.adminConfirmedBy && details.adminConfirmationTimestamp &&(
                        <p className="text-xs text-muted-foreground mb-0.5">
                            <ShieldCheck size={14} className="inline mr-1 text-blue-500"/>Admin Confirmó: {details.adminConfirmedBy} ({format(new Date(details.adminConfirmationTimestamp), "dd/MM/yy HH:mm", { locale: es })})
                        </p>
                      )}
                      {details.consultasUserConfirmedBy && details.consultasUserConfirmationTimestamp && (
                        <p className="text-xs text-muted-foreground mb-1">
                            <UserCheck size={14} className="inline mr-1 text-purple-500"/>Consultas Confirmó: {details.consultasUserConfirmedBy} ({format(new Date(details.consultasUserConfirmationTimestamp), "dd/MM/yy HH:mm", { locale: es })})
                        </p>
                      )}
                      {details.cancelledBy && details.cancellationTimestamp && (
                        <p className="text-xs text-muted-foreground mb-1">
                            <XCircle size={14} className="inline mr-1 text-red-500"/>Cancelado Por: {details.cancelledBy} ({format(new Date(details.cancellationTimestamp), "dd/MM/yy HH:mm", { locale: es })})
                        </p>
                      )}


                      <div className="text-sm mt-1">
                        <Textarea
                          readOnly
                          value={details.report as string}
                          className="w-full h-48 text-xs font-mono bg-muted/50 p-2 border-input focus:ring-0 focus:outline-none mb-2"
                          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        />
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyToClipboard(details.report as string)}
                            >
                                <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar Reporte
                            </Button>
                            <div className="flex gap-2 flex-wrap justify-end">
                                {canAdminCancel && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => onCancelTransfer(log.id)}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" /> Cancelar
                                    </Button>
                                )}
                                {canAdminConfirm && (
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => onConfirmReception(log.id, 'admin')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Confirmar (Admin)
                                    </Button>
                                )}
                                {canConsultasConfirm && (
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => onConfirmReception(log.id, 'consultas')}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" /> Confirmar (Consultas)
                                    </Button>
                                )}
                            </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
