
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea"; 
import type { LogEntry, LogEntryDetails_ITEMS_TRANSFERRED, LogEntryDetails_TRANSFER_CONFIRMED, LogEntryDetails_PRODUCT_TYPE_DELETED, LogEntryDetails_ITEMS_REASSIGNED, UserRole } from "@/types/inventory";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldAlert, BookText, KeyRound, ClipboardCopy, User as UserIcon, CheckCircle, Clock, ShieldCheck, UserCheck as UserCheckIcon, FileText, Recycle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActivityLogDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  logs: LogEntry[];
  requiredPassword?: string;
}

export function ActivityLogDialog({ isOpen, onOpenChange, logs, requiredPassword }: ActivityLogDialogProps) {
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      if (requiredPassword) {
        setPasswordInput("");
        setIsAuthenticated(false);
        setShowPasswordError(false);
      }
    } else {
      if (!requiredPassword) {
        setIsAuthenticated(true);
      }
    }
  }, [isOpen, requiredPassword]);

  const handlePasswordSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (requiredPassword && passwordInput === requiredPassword) {
      setIsAuthenticated(true);
      setShowPasswordError(false);
      toast({ title: "Acceso Concedido", description: "Viendo log de actividad." });
    } else {
      setIsAuthenticated(false);
      setShowPasswordError(true);
      toast({ title: "Contraseña Incorrecta", variant: "destructive" });
    }
  };

  const getActionDisplayName = (action: string) => {
    const nameMap: Record<string, string> = {
        PRODUCT_TYPE_ADDED: "Tipo de Producto Añadido",
        PRODUCT_TYPE_UPDATED: "Tipo de Producto Actualizado",
        PRODUCT_TYPE_DELETED: "Tipo de Producto Eliminado",
        ITEMS_REASSIGNED_PRODUCT_TYPE: "Artículos Reasignados (Tipo Prod.)",
        ITEM_ADDED: "Artículo(s) Añadido(s)",
        ITEMS_STATUS_CHANGED: "Estatus de Artículo(s) Cambiado",
        ITEMS_TRANSFERRED: "Transferencia de Artículos Iniciada",
        ITEMS_DELETED: "Artículo(s) Eliminado(s)",
        USER_LOGIN: "Inicio de Sesión",
        USER_LOGOUT: "Cierre de Sesión",
        TRANSFER_CONFIRMED: "Transferencia Confirmada",
    };
    return nameMap[action] || action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  const formatLogDetails = (log: LogEntry): React.ReactNode => {
    const { details, action } = log;
    
    if (action === "ITEMS_TRANSFERRED") {
        const transferDetails = details as LogEntryDetails_ITEMS_TRANSFERRED;
        let statusText = "";
        if (transferDetails.transferState === 'completed') {
            statusText = "Completado";
            let adminInfo = transferDetails.adminConfirmedBy ? `Admin: ${transferDetails.adminConfirmedBy}` : '';
            let consultasInfo = transferDetails.consultasUserConfirmedBy ? `Consultas: ${transferDetails.consultasUserConfirmedBy}` : '';
            
            if (adminInfo && consultasInfo) {
                statusText += ` (${adminInfo}, ${consultasInfo})`;
            } else if (adminInfo) {
                statusText += ` (${adminInfo})`;
            } else if (consultasInfo) { 
                statusText += ` (${consultasInfo})`;
            }
        } else if (transferDetails.transferState === 'pending_consultas_confirmation') {
            statusText = `Pendiente Consultas (Admin: ${transferDetails.adminConfirmedBy || 'N/A'})`;
        } else if (transferDetails.transferState === 'pending_admin_confirmation') {
            statusText = "Pendiente Admin";
        } else {
            statusText = `Pendiente (Estado: ${transferDetails.transferState || "Desconocido"})`;
        }


        return (
            <>
                {transferDetails.transferFolio && (
                    <p className="text-xs mb-1"><span className="font-semibold"><FileText size={14} className="inline mr-1"/>Folio:</span> {transferDetails.transferFolio}</p>
                )}
                <p className="text-xs mb-1">
                    <span className="font-semibold">Destino:</span> {transferDetails.targetStoreName || 'N/A'}, {' '}
                    <span className="font-semibold">Cantidad:</span> {transferDetails.count} artículo(s)
                </p>
                <p className="text-xs mb-1">
                    <span className="font-semibold">Estado:</span> {transferDetails.transferState === 'completed' ? 
                        <span className="text-green-600"><CheckCircle size={14} className="inline mr-1"/>{statusText}</span> : 
                        <span className="text-yellow-700"><Clock size={14} className="inline mr-1"/>{statusText}</span>
                    }
                </p>
                {transferDetails.initiatorUserName && (
                    <p className="text-xs mb-1"><span className="font-semibold">Iniciado por:</span> {transferDetails.initiatorUserName}</p>
                )}
                {transferDetails.adminConfirmedBy && (
                    <p className="text-xs mb-1"><ShieldCheck size={14} className="inline mr-1 text-blue-500"/><span className="font-semibold">Admin Confirmó:</span> {transferDetails.adminConfirmedBy} ({transferDetails.adminConfirmationTimestamp ? format(new Date(transferDetails.adminConfirmationTimestamp), "dd/MM/yy HH:mm", { locale: es }) : 'N/A'})</p>
                )}
                {transferDetails.consultasUserConfirmedBy && (
                    <p className="text-xs mb-1"><UserCheckIcon size={14} className="inline mr-1 text-purple-500"/><span className="font-semibold">Consultas Confirmó:</span> {transferDetails.consultasUserConfirmedBy} ({transferDetails.consultasUserConfirmationTimestamp ? format(new Date(transferDetails.consultasUserConfirmationTimestamp), "dd/MM/yy HH:mm", { locale: es }) : 'N/A'})</p>
                )}
                <p className="text-xs font-semibold mb-1">IMEIs: {transferDetails.imeis.join(', ')}</p>
                {transferDetails.report && (
                    <div className="mt-2 space-y-1">
                        <h4 className="font-semibold text-xs text-foreground/80">Reporte de Transferencia:</h4>
                        <Textarea
                            readOnly
                            value={transferDetails.report}
                            className="w-full h-32 text-xs font-mono bg-muted/50 p-1.5 border-input focus:ring-0 focus:outline-none"
                            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={async () => {
                                await navigator.clipboard.writeText(transferDetails.report);
                                toast({ title: "Reporte Copiado" });
                            }}
                        >
                            <ClipboardCopy className="mr-1 h-3 w-3" /> Copiar Reporte
                        </Button>
                    </div>
                )}
            </>
        );
    }

    if (action === "TRANSFER_CONFIRMED") {
        const confirmDetails = details as LogEntryDetails_TRANSFER_CONFIRMED;
        const Icon = confirmDetails.confirmationType === 'admin' ? ShieldCheck : UserCheckIcon;
        const colorClass = confirmDetails.confirmationType === 'admin' ? 'text-blue-500' : 'text-purple-500';
        return (
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs bg-secondary/30 p-2 rounded-md">
                {confirmDetails.transferFolio && (
                    <li><span className="font-semibold"><FileText size={14} className="inline mr-1"/>Folio Transferencia:</span> {confirmDetails.transferFolio}</li>
                )}
                <li><Icon size={14} className={`inline mr-1 ${colorClass}`}/><span className="font-semibold">Confirmado por ({confirmDetails.confirmationType}):</span> {confirmDetails.confirmedBy}</li>
                <li><span className="font-semibold">Transferencia Original ID:</span> {confirmDetails.originalTransferLogId}</li>
                <li><span className="font-semibold">Destino:</span> {confirmDetails.targetStoreName || 'N/A'}</li>
                <li><span className="font-semibold">Cantidad:</span> {confirmDetails.itemCount} artículo(s)</li>
                <li><span className="font-semibold">IMEIs:</span> {confirmDetails.imeis.join(', ')}</li>
            </ul>
        );
    }

    if (action === "PRODUCT_TYPE_DELETED") {
        const deleteDetails = details as LogEntryDetails_PRODUCT_TYPE_DELETED;
        return (
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs bg-destructive/10 p-2 rounded-md">
                <li><Trash2 size={14} className="inline mr-1 text-destructive"/> <span className="font-semibold">Tipo de Producto:</span> {deleteDetails.brand} {deleteDetails.model} (ID: {deleteDetails.productId})</li>
                {deleteDetails.reassignedItemsTo && (
                    <>
                        <li><span className="font-semibold">Artículos Reasignados a:</span> {deleteDetails.reassignedItemsTo.newProductBrandModel} (ID: {deleteDetails.reassignedItemsTo.newProductId})</li>
                        <li><span className="font-semibold">Cantidad Reasignada:</span> {deleteDetails.reassignedItemsTo.itemCount} artículo(s)</li>
                    </>
                )}
            </ul>
        );
    }
    
    if (action === "ITEMS_REASSIGNED_PRODUCT_TYPE") {
        const reassignDetails = details as LogEntryDetails_ITEMS_REASSIGNED;
        return (
            <ul className="list-disc list-inside space-y-1 pl-2 text-xs bg-orange-100 dark:bg-orange-900/30 p-2 rounded-md">
                <li><Recycle size={14} className="inline mr-1 text-orange-600"/> <span className="font-semibold">Artículos:</span> {reassignDetails.itemCount} artículo(s)</li>
                <li><span className="font-semibold">Desde:</span> {reassignDetails.originalProductBrandModel} (ID: {reassignDetails.originalProductId})</li>
                <li><span className="font-semibold">Hacia:</span> {reassignDetails.newProductBrandModel} (ID: {reassignDetails.newProductId})</li>
                <li><span className="font-semibold">IMEIs Reasignados:</span> {reassignDetails.imeis.join(', ')}</li>
            </ul>
        );
    }


    const detailKeysToExclude = [
        'report', 'transferState', 'completedBy', 'completionTimestamp', 
        'initiatorUserName', 'reportItemDetailsForConfirmation', 
        'initiatorUserNameForConfirmation', 'adminConfirmedBy', 'adminConfirmationTimestamp',
        'consultasUserConfirmedBy', 'consultasUserConfirmationTimestamp', 
        'targetStoreRequiresConsultasConfirmation', 'transferFolio',
        'reassignedItemsTo' // handled above for PRODUCT_TYPE_DELETED
    ];
    const detailEntries = Object.entries(details).filter(([key]) => !detailKeysToExclude.includes(key));


    return (
      <>
        {detailEntries.length > 0 && (
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs bg-secondary/30 p-2 rounded-md mb-2">
            {detailEntries.map(([key, value]) => (
              <li key={key}>
                <span className="font-semibold">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                {typeof value === 'object' && value !== null ? (
                  <pre className="ml-2 mt-1 text-xs bg-muted/50 p-1.5 rounded-sm overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <span className="ml-1">{String(value)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {detailEntries.length === 0 && !["ITEMS_TRANSFERRED", "TRANSFER_CONFIRMED", "PRODUCT_TYPE_DELETED", "ITEMS_REASSIGNED_PRODUCT_TYPE"].includes(action) && (
           <p className="text-xs text-muted-foreground italic pl-2">Sin detalles adicionales específicos.</p>
        )}
      </>
    );
  };
  
  const sortedLogs = logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isAuthenticated || !requiredPassword ? <BookText className="mr-2 h-5 w-5" /> : <ShieldAlert className="mr-2 h-5 w-5 text-primary" />}
            {isAuthenticated || !requiredPassword ? "Log de Actividad del Inventario" : "Acceso Restringido"}
          </DialogTitle>
          <DialogDescription>
            {isAuthenticated || !requiredPassword
              ? "Aquí se muestran todos los movimientos y cambios realizados en el inventario."
              : "Ingresa la contraseña de administrador para ver el log de actividad."}
          </DialogDescription>
        </DialogHeader>

        {(!isAuthenticated && requiredPassword) ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="log-password">Contraseña de Administrador</Label>
              <Input
                id="log-password"
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (showPasswordError) setShowPasswordError(false);
                }}
                placeholder="Ingresa la contraseña"
                className={showPasswordError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {showPasswordError && (
                <p className="text-sm font-medium text-destructive mt-1">
                  La contraseña proporcionada es incorrecta.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <KeyRound className="mr-2 h-4 w-4" />
                Ver Logs
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-1 flex-grow overflow-hidden">
            {sortedLogs.length === 0 ? (
              <p className="text-center text-muted-foreground mt-8">No hay entradas en el log de actividad todavía.</p>
            ) : (
              <ScrollArea className="h-[calc(80vh-200px)] pr-3">
                <ul className="space-y-4">
                  {sortedLogs.map((log) => (
                    <li key={log.id} className="p-3 border rounded-md shadow-sm bg-card hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-1.5">
                        <div>
                            <span className="font-semibold text-primary text-base">{getActionDisplayName(log.action)}</span>
                            {log.user && (
                                <span className="ml-2 text-xs text-muted-foreground flex items-center">
                                    <UserIcon className="mr-1 h-3 w-3" /> {log.user} {log.userRole && `(${log.userRole})`}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                        </span>
                      </div>
                      <div className="text-sm mt-1">
                        {formatLogDetails(log)}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
