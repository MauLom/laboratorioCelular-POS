
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompareArrows, AlertTriangle, ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompareImeiListsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const extractImeisFromString = (text: string): Set<string> => {
  const imeiRegex = /\b\d{10,20}\b/g;
  const matches = text.match(imeiRegex) || [];
  return new Set(matches.map(imei => imei.trim()).filter(imei => imei.length >= 10));
};

export function CompareImeiListsDialog({
  isOpen,
  onOpenChange,
}: CompareImeiListsDialogProps) {
  const { toast } = useToast();
  const [systemImeiText, setSystemImeiText] = useState("");
  const [branchImeiText, setBranchImeiText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSystemImeiText("");
      setBranchImeiText("");
    }
  }, [isOpen]);

  const handleProcessAndCompare = () => {
    if (!systemImeiText.trim() && !branchImeiText.trim()) {
      toast({
        title: "Entradas Vacías",
        description: "Por favor, pega las listas de IMEIs en las áreas de texto.",
        variant: "destructive",
      });
      return;
    }

    const systemImeis = extractImeisFromString(systemImeiText);
    const branchImeis = extractImeisFromString(branchImeiText);

    const onlyInSystem = new Set<string>();
    const onlyInBranch = new Set<string>();
    const inBoth = new Set<string>();

    systemImeis.forEach(imei => {
      if (branchImeis.has(imei)) {
        inBoth.add(imei);
      } else {
        onlyInSystem.add(imei);
      }
    });

    branchImeis.forEach(imei => {
      if (!systemImeis.has(imei)) {
        onlyInBranch.add(imei);
      }
    });

    const now = new Date();
    const formattedTimestamp = format(now, "dd/MM/yyyy HH:mm:ss", { locale: es });

    let reportContent = `REPORTE DE COTEJO DE LISTAS DE IMEI\n`;
    reportContent += `Fecha y Hora de Generación: ${formattedTimestamp}\n\n`;
    reportContent += `Resumen:\n`;
    reportContent += `- IMEIs Únicos en Lista Sistema: ${systemImeis.size}\n`;
    reportContent += `- IMEIs Únicos en Lista Sucursal: ${branchImeis.size}\n`;
    reportContent += `- Coincidentes: ${inBoth.size}\n`;
    reportContent += `- Solo en Sistema: ${onlyInSystem.size}\n`;
    reportContent += `- Solo en Sucursal: ${onlyInBranch.size}\n\n`;
    reportContent += `---------------------------------\n`;
    reportContent += `IMEIs SOLO EN SISTEMA (${onlyInSystem.size}):\n`;
    if (onlyInSystem.size > 0) {
      Array.from(onlyInSystem).sort().forEach(imei => reportContent += `- ${imei}\n`);
    } else {
      reportContent += `(Ninguno)\n`;
    }
    reportContent += `\n---------------------------------\n`;
    reportContent += `IMEIs SOLO EN SUCURSAL (${onlyInBranch.size}):\n`;
    if (onlyInBranch.size > 0) {
      Array.from(onlyInBranch).sort().forEach(imei => reportContent += `- ${imei}\n`);
    } else {
      reportContent += `(Ninguno)\n`;
    }
    reportContent += `\n---------------------------------\n`;
    reportContent += `IMEIs COINCIDENTES (${inBoth.size}):\n`;
    if (inBoth.size > 0) {
      Array.from(inBoth).sort().forEach(imei => reportContent += `- ${imei}\n`);
    } else {
      reportContent += `(Ninguno)\n`;
    }

    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write('<html><head><title>Reporte de Cotejo de IMEIs</title>');
      newWindow.document.write(`
        <style>
          body { font-family: Inter, sans-serif; line-height: 1.6; padding: 20px; margin:0; background-color: #f9fafb; color: #1f2937;}
          .container { max-width: 800px; margin: 20px auto; background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          h1 { color: #2563eb; font-size: 1.5em; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top:0; }
          h3 { font-size: 1.1em; color: #374151; margin-top: 20px; margin-bottom: 8px; }
          pre { background-color: #f3f4f6; padding: 15px; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 0.9em; border: 1px solid #d1d5db; }
          button {
            padding: 10px 15px; font-size: 0.9em; color: white; background-color: #2563eb; border: none; border-radius: 6px; cursor: pointer; transition: background-color 0.2s; margin-bottom: 20px;
          }
          button:hover { background-color: #1d4ed8; }
          .report-header { margin-bottom: 15px; }
        </style>
      `);
      newWindow.document.write('</head><body><div class="container">');
      newWindow.document.write('<h1>Reporte de Cotejo de IMEIs</h1>');
      newWindow.document.write('<button id="copyReportButton">Copiar Reporte Completo</button>');
      newWindow.document.write('<div id="reportTextContainer"><pre>' + reportContent.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</pre></div>');
      
      newWindow.document.write(`
        <script>
          document.getElementById('copyReportButton').addEventListener('click', function() {
            const reportText = document.getElementById('reportTextContainer').innerText;
            if (navigator.clipboard && window.isSecureContext) {
              navigator.clipboard.writeText(reportText).then(function() {
                alert('¡Reporte copiado al portapapeles!');
                document.getElementById('copyReportButton').innerText = '¡Copiado!';
                setTimeout(function() {
                   document.getElementById('copyReportButton').innerText = 'Copiar Reporte Completo';
                }, 2000);
              }, function(err) {
                alert('Error al copiar el reporte: ' + err);
                console.error('Error al copiar: ', err);
              });
            } else {
              // Fallback for non-secure contexts or older browsers
              try {
                const textArea = document.createElement('textarea');
                textArea.value = reportText;
                textArea.style.position = 'fixed'; // Prevent scrolling to bottom of page in MS Edge.
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('¡Reporte copiado al portapapeles! (modo fallback)');
                document.getElementById('copyReportButton').innerText = '¡Copiado! (fallback)';
                 setTimeout(function() {
                   document.getElementById('copyReportButton').innerText = 'Copiar Reporte Completo';
                }, 2000);
              } catch (e) {
                alert('No se pudo copiar el reporte. Por favor, cópialo manualmente.');
                console.error('Error al copiar (fallback): ', e);
              }
            }
          });
        </script>
      `);
      newWindow.document.write('</div></body></html>');
      newWindow.document.close();

      toast({ title: "Comparación Completada", description: "El reporte de cotejo se ha abierto en una nueva ventana." });
    } else {
      toast({ title: "Error al Abrir Ventana", description: "No se pudo abrir una nueva ventana. Revisa la configuración de tu navegador (bloqueador de pop-ups).", variant: "destructive", duration: 7000 });
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center">
            <GitCompareArrows className="mr-2 h-5 w-5 text-primary" />
            Cotejar Listas de IMEIs
          </DialogTitle>
          <DialogDescription>
            Pega las listas de IMEIs (una por línea o separadas por espacios/comas) para compararlas.
            El sistema extraerá solo los números de 10-20 dígitos.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6 py-4">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="system-imei-list">Lista de IMEIs del Sistema</Label>
                    <Textarea
                    id="system-imei-list"
                    placeholder="Pega aquí la lista de IMEIs de tu sistema..."
                    value={systemImeiText}
                    onChange={(e) => setSystemImeiText(e.target.value)}
                    rows={8}
                    className="font-mono text-xs mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="branch-imei-list">Lista de IMEIs de Sucursal (Reportada)</Label>
                    <Textarea
                    id="branch-imei-list"
                    placeholder="Pega aquí la lista de IMEIs reportada por la sucursal..."
                    value={branchImeiText}
                    onChange={(e) => setBranchImeiText(e.target.value)}
                    rows={8}
                    className="font-mono text-xs mt-1"
                    />
                </div>
                </div>

                <Button onClick={handleProcessAndCompare} className="w-full md:w-auto">
                    Procesar y Comparar Listas
                </Button>

                {(systemImeiText.trim() || branchImeiText.trim()) && (
                    <div className="mt-4 p-4 border border-dashed rounded-md text-center text-muted-foreground">
                        <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-primary" />
                        <p>Presiona "Procesar y Comparar Listas" para generar el reporte en una nueva ventana.</p>
                    </div>
                )}
            </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

