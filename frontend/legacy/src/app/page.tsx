
"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppHeader } from "@/components/AppHeader";
import { AddProductDialog } from "@/components/inventory/AddProductDialog";
import { SelectProductToEditDialog } from "@/components/inventory/SelectProductToEditDialog";
import { EditProductTypeDialog } from "@/components/inventory/EditProductTypeDialog";
import { ConfirmAdminPasswordDialog } from "@/components/inventory/ConfirmAdminPasswordDialog";
import { ReassignItemsBeforeDeleteDialog } from "@/components/inventory/ReassignItemsBeforeDeleteDialog"; 
import { AddItemDialog } from "@/components/inventory/AddItemDialog";
import { BulkChangeStatusDialog } from "@/components/inventory/BulkChangeStatusDialog";
import { BulkTransferDialog } from "@/components/inventory/BulkTransferDialog";
import { BulkSelectByImeiDialog } from "@/components/inventory/BulkSelectByImeiDialog";
import { DeleteItemConfirmationDialog } from "@/components/inventory/DeleteItemConfirmationDialog";
import { ActivityLogDialog } from "@/components/inventory/ActivityLogDialog";
import { TransferReportsDialog } from "@/components/inventory/TransferReportsDialog";
import { DatabaseManagementDialog } from "@/components/inventory/DatabaseManagementDialog";
import { InventoryReportsDialog } from "@/components/inventory/InventoryReportsDialog";
import { SelectedItemDetailsDialog } from "@/components/inventory/SelectedItemDetailsDialog";
import { SoldItemsReportDialog } from "@/components/inventory/SoldItemsReportDialog";
import { CompareImeiListsDialog } from "@/components/inventory/CompareImeiListsDialog";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventorySearchBar } from "@/components/inventory/InventorySearchBar";
import { BulkActionsBar } from "@/components/inventory/BulkActionsBar";
import { UserLoginDialog } from "@/components/auth/UserLoginDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Info, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ProductType, Store, InventoryItem, ItemStatus, LogEntry, LogEntryAction, User, LogEntryDetails_ITEMS_TRANSFERRED, UserRole, LogEntryDetails_TRANSFER_CONFIRMED, LogEntryDetails_PRODUCT_TYPE_DELETED, LogEntryDetails_ITEMS_REASSIGNED, TransferReportItemDetail, LogEntryDetails_TRANSFER_CANCELLED } from "@/types/inventory";
import { PackagePlus, ListPlus, Warehouse, BookText, ClipboardList, Pencil, ListChecks, Database, FileSpreadsheet, GitCompareArrows, ShieldCheck, Shapes } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


const INITIAL_STORES: Store[] = [
  { id: "store1", name: "CCF#1 Hidalgo" },
  { id: "store2", name: "CCF#2 Colinas" },
  { id: "store3", name: "CCF#3 Reservas" },
  { id: "store4", name: "CCF#4 Voluntad" },
  { id: "store5", name: "CCF#5 Villas" },
  { id: "store6", name: "Bodega" },
  { id: "store7", name: "Mauricio" },
];

const ADMIN_USERS_DATA: User[] = [
  { id: "user_david", name: "David", passwordHash: "123", role: "admin" },
  { id: "user_victoria", name: "Victoria", passwordHash: "123", role: "admin" },
  { id: "user_vanessa", name: "Vanessa", passwordHash: "123", role: "admin" },
  { id: "user_blanca", name: "Blanca", passwordHash: "123", role: "admin" },
  { id: "user_jesus", name: "Jesus", passwordHash: "123", role: "admin" },
  { id: "user_alejandrina_admin", name: "Alejandrina", passwordHash: "123", role: "admin" },
];

const CONSULTAS_USERS_DATA: User[] = [
    { id: "user_litzi_base", name: "Litzi", passwordHash: "123", role: "consultas" },
    { id: "user_lorena_base", name: "Lorena", passwordHash: "123", role: "consultas" },
    { id: "user_abigail_base", name: "Abigail", passwordHash: "123", role: "consultas" },
    { id: "user_fatima_base", name: "Fatima", passwordHash: "123", role: "consultas" },
    { id: "user_alejandrina_c_base", name: "Alejandrina C", passwordHash: "123", role: "consultas" },
    { id: "user_carolina_base", name: "Carolina", passwordHash: "123", role: "consultas" },
    { id: "user_montserat_base", name: "Montserat", passwordHash: "123", role: "consultas" },
    { id: "user_brayan_base", name: "Brayan", passwordHash: "123", role: "consultas" },
];


const ALL_USERS = [...ADMIN_USERS_DATA, ...CONSULTAS_USERS_DATA];

const REQUIRED_PASSWORD_FOR_ACTIONS = "123";

const generateTransferReportText = (
  itemDetails: TransferReportItemDetail[],
  targetStoreName: string,
  transferFolio: string,
  initiatorUserName?: string,
  transferState?: LogEntryDetails_ITEMS_TRANSFERRED['transferState'],
  adminConfirmer?: string,
  consultasConfirmer?: string,
  cancelledBy?: string,
  cancellationTimestamp?: string
): string => {
  const now = new Date();
  const formattedTimestamp = format(now, "dd/MM/yyyy HH:mm:ss", { locale: es });

  let report = `**REPORTE DE TRANSFERENCIA**\n\n`;
  report += `Folio de Transferencia: ${transferFolio}\n`;
  report += `Fecha y Hora de Creación: ${formattedTimestamp}\n`;
  if (initiatorUserName) {
    report += `Transferencia iniciada por: ${initiatorUserName}\n`;
  }
  report += `Tienda Destino: ${targetStoreName || 'Desconocida'}\n\n`;
  report += `Artículos Transferidos (${itemDetails.length}):\n`;
  report += `---------------------------------\n`;

  itemDetails.forEach((item, index) => {
    report += `${index + 1}. IMEI: ${item.imei}\n`;
    report += `   Producto: ${item.productTypeName}\n`;
    if(item.color) report += `   Color: ${item.color}\n`;
    report += `   Desde: ${item.originalStoreName || 'N/A'}\n`;
    if (index < itemDetails.length - 1) {
      report += `---------------------------------\n`;
    }
  });
  report += `---------------------------------\n`;

  let statusText = "";
  if (transferState === 'completed') {
    statusText = "COMPLETADO";
    let adminPart = adminConfirmer ? `Admin: ${adminConfirmer}` : '';
    let consultasPart = consultasConfirmer ? `Consultas: ${consultasConfirmer}` : '';
    
    if (adminPart && consultasPart) {
      statusText += ` (${adminPart}, ${consultasPart})`;
    } else if (adminPart) {
      statusText += ` (${adminPart})`;
    } else if (consultasPart) {
      statusText += ` (${consultasPart})`;
    }
  } else if (transferState === 'pending_consultas_confirmation') {
     statusText = `PENDIENTE CONFIRMACIÓN CONSULTAS (Admin: ${adminConfirmer || 'N/A'})`;
  } else if (transferState === 'pending_admin_confirmation') {
     statusText = "PENDIENTE CONFIRMACIÓN ADMIN";
  } else if (transferState === 'cancelled') {
    statusText = "CANCELADO";
    if (cancelledBy) {
        statusText += ` (Por: ${cancelledBy}`;
        if (cancellationTimestamp) {
            statusText += ` el ${format(new Date(cancellationTimestamp), "dd/MM/yyyy HH:mm", { locale: es })}`;
        }
        statusText += ')';
    }
  } else {
    statusText = `PENDIENTE (Estado: ${transferState || "Desconocido"})`;
  }

  report += `\nEstado: ${statusText}\n`;
  if (transferState !== 'completed' && transferState !== 'cancelled') {
    report += `\nConfirmar recepción de los artículos mencionados.`;
  }

  return report;
};

interface StoreProductBreakdown {
  productTypeName: string;
  count: number;
}

interface DetailedStoreSummary {
  storeId: string;
  storeName: string;
  totalActiveCount: number;
  products: StoreProductBreakdown[];
}


export default function HomePage() {
  const { toast } = useToast();

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);
  const [transferFolioCounter, setTransferFolioCounter] = useState<number>(1);

  const stores = INITIAL_STORES;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserLoginDialogOpen, setIsUserLoginDialogOpen] = useState(false);
  const [userAttemptingLogin, setUserAttemptingLogin] = useState<User | null>(null);

  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);

  const [isBulkChangeStatusDialogOpen, setIsBulkChangeStatusDialogOpen] = useState(false);
  const [isBulkTransferDialogOpen, setIsBulkTransferDialogOpen] = useState(false);
  const [isBulkSelectByImeiDialogOpen, setIsBulkSelectByImeiDialogOpen] = useState(false);
  const [isDeleteItemConfirmationDialogOpen, setIsDeleteItemConfirmationDialogOpen] = useState(false);
  const [isActivityLogDialogOpen, setIsActivityLogDialogOpen] = useState(false);
  const [isTransferReportsDialogOpen, setIsTransferReportsDialogOpen] = useState(false);
  const [isDatabaseManagementDialogOpen, setIsDatabaseManagementDialogOpen] = useState(false);
  const [isInventoryReportsDialogOpen, setIsInventoryReportsDialogOpen] = useState(false);
  const [isSelectedItemDetailsDialogOpen, setIsSelectedItemDetailsDialogOpen] = useState(false);
  const [isSoldItemsReportDialogOpen, setIsSoldItemsReportDialogOpen] = useState(false);
  const [isCompareImeiListsDialogOpen, setIsCompareImeiListsDialogOpen] = useState(false);
  
  const [productToEdit, setProductToEdit] = useState<ProductType | null>(null);
  const [isSelectProductToEditDialogOpen, setIsSelectProductToEditDialogOpen] = useState(false);
  const [isEditProductAdminAuthDialogOpen, setIsEditProductAdminAuthDialogOpen] = useState(false);
  const [isEditProductTypeDialogOpen, setIsEditProductTypeDialogOpen] = useState(false);

  const [productTypeToDelete, setProductTypeToDelete] = useState<ProductType | null>(null);
  const [isDeleteProductAdminAuthDialogOpen, setIsDeleteProductAdminAuthDialogOpen] = useState(false);
  const [isReassignItemsDialogOpen, setIsReassignItemsDialogOpen] = useState(false);
  const [itemsToReassignDetails, setItemsToReassignDetails] = useState<{ count: number; productTypeId: string; productName: string; imeis: string[] } | null>(null);
  const [otherProductTypesForReassignment, setOtherProductTypesForReassignment] = useState<ProductType[]>([]);

  const [selectedItemImeis, setSelectedItemImeis] = useState<string[]>([]);

  const [selectedStoreFilter, setSelectedStoreFilter] = useState("all");
  const [selectedModelFilter, setSelectedModelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [transferDialogReopenTrigger, setTransferDialogReopenTrigger] = useState(0);

  const [isConfirmLostStatusAdminAuthDialogOpen, setIsConfirmLostStatusAdminAuthDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ newStatus: ItemStatus; imeis: string[] } | null>(null);

  const [toastMessageToShow, setToastMessageToShow] = useState<{ title: string; description: React.ReactNode; variant?: "default" | "destructive", duration?: number } | null>(null);

  const isSearching = useMemo(() => searchQuery.trim() !== "", [searchQuery]);
  const isAdminRole = currentUser?.role === 'admin';
  const isConsultasRole = currentUser?.role === 'consultas';
  const isAnyActionDisabled = !currentUser;


  useEffect(() => {
    const savedProductTypesRaw = localStorage.getItem("celltrack_productTypes");
    if (savedProductTypesRaw) {
      try {
        let parsedProductTypes: ProductType[] = JSON.parse(savedProductTypesRaw).map((pt: any) => ({
          id: pt.id,
          brand: pt.brand,
          model: pt.model,
          minimumStock: pt.minimumStock === undefined || pt.minimumStock === null ? undefined : Number(pt.minimumStock),
        }));
        
        const incorrectProductTypeNameToRemove = "Xiamo Redmi Note 13"; 
        const incorrectProductTypeBrandToRemove = "Xiamo"; 
        
        const initialCount = parsedProductTypes.length;
        parsedProductTypes = parsedProductTypes.filter(pt => 
          !(pt.brand.toLowerCase() === incorrectProductTypeBrandToRemove.toLowerCase() && pt.model.toLowerCase() === incorrectProductTypeNameToRemove.toLowerCase().replace("xiamo ", "xiaomi "))
        );

        if (parsedProductTypes.length < initialCount) {
          localStorage.setItem("celltrack_productTypes", JSON.stringify(parsedProductTypes));
        }
        setProductTypes(parsedProductTypes.sort((a,b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model)));
      } catch (error) {
        console.error("Error parsing productTypes from localStorage:", error);
        setProductTypes([]);
         setToastMessageToShow({
          title: "Error de Datos de Tipos de Producto",
          description: "Hubo un problema al cargar los tipos de producto. Algunos datos podrían estar corruptos.",
          variant: "destructive"
        });
      }
    }


    const savedInventoryItems = localStorage.getItem("celltrack_inventoryItems");
    if (savedInventoryItems) {
      try {
        const parsedItems: InventoryItem[] = JSON.parse(savedInventoryItems).map((item: any): InventoryItem => ({
          ...item,
          purchasePrice: Number(item.purchasePrice) || 0,
          purchaseInvoiceDate: item.purchaseInvoiceDate || new Date().toISOString().split("T")[0],
          status: item.status || "Nuevo",
          color: item.color,
        }));

        const uniqueItems: InventoryItem[] = [];
        const seenImeis = new Set<string>();
        for (const item of parsedItems) {
          if (item.imei && !seenImeis.has(item.imei)) {
            uniqueItems.push(item);
            seenImeis.add(item.imei);
          } else {
             // console.warn(`Duplicate or missing IMEI found in localStorage during load: "${item.imei}". Skipping.`);
          }
        }
        setInventoryItems(uniqueItems);

        if (uniqueItems.length < parsedItems.length) {
            setToastMessageToShow({
                title: "Datos Duplicados Corregidos",
                description: `${parsedItems.length - uniqueItems.length} artículo(s) duplicado(s) o con IMEI faltante fueron encontrados y omitidos al cargar.`,
                variant: "default",
                duration: 7000,
            });
            localStorage.setItem("celltrack_inventoryItems", JSON.stringify(uniqueItems));
        }
      } catch (error) {
        console.error("Error parsing or processing inventoryItems from localStorage:", error);
        setInventoryItems([]);
        setToastMessageToShow({
          title: "Error de Datos de Inventario",
          description: "Hubo un problema al cargar los artículos del inventario. Algunos datos podrían estar corruptos.",
          variant: "destructive"
        });
      }
    }


    const savedActivityLogsRaw = localStorage.getItem("celltrack_activityLogs");
    if (savedActivityLogsRaw) {
      try {
        const parsedLogs = JSON.parse(savedActivityLogsRaw);
        setActivityLogs(parsedLogs.sort((a: LogEntry, b: LogEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (error) {
        console.error("Error parsing activityLogs from localStorage:", error);
        setActivityLogs([]);
        setToastMessageToShow({
          title: "Error de Datos de Actividad",
          description: "Hubo un problema al cargar el historial de actividad. Algunos datos podrían estar corruptos y han sido reiniciados. Revisa la consola.",
          variant: "destructive"
        });
      }
    }

    const savedFolioCounter = localStorage.getItem("celltrack_transferFolioCounter");
    if (savedFolioCounter) {
      setTransferFolioCounter(parseInt(savedFolioCounter, 10));
    }


    const savedCurrentUser = localStorage.getItem("celltrack_currentUser");
    if (savedCurrentUser) {
        try {
            const user: User = JSON.parse(savedCurrentUser);
            const baseUserList = user.role === 'consultas' ? CONSULTAS_USERS_DATA : ADMIN_USERS_DATA;
            const baseUserExists = baseUserList.find(u => u.id === user.id && u.passwordHash === user.passwordHash && u.role === user.role);

            if (baseUserExists) {
              if (user.role === 'consultas') {
                const storeIsValid = user.storeId && INITIAL_STORES.some(s => s.id === user.storeId);
                if (storeIsValid) {
                  setCurrentUser(user); 
                } else {
                  localStorage.removeItem("celltrack_currentUser");
                  setCurrentUser(null);
                }
              } else { 
                setCurrentUser(user);
              }
            } else {
              localStorage.removeItem("celltrack_currentUser");
              setCurrentUser(null);
            }
          } catch (error) {
            console.error("Failed to parse currentUser from localStorage:", error);
            localStorage.removeItem("celltrack_currentUser");
            setCurrentUser(null);
          }
    } else {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (toastMessageToShow) {
      toast(toastMessageToShow);
      setToastMessageToShow(null);
    }
  }, [toastMessageToShow, toast]);


  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("celltrack_currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("celltrack_currentUser");
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("celltrack_productTypes", JSON.stringify(productTypes));
  }, [productTypes]);

  useEffect(() => {
    localStorage.setItem("celltrack_inventoryItems", JSON.stringify(inventoryItems));
  }, [inventoryItems]);

  useEffect(() => {
    try {
      localStorage.setItem("celltrack_activityLogs", JSON.stringify(activityLogs));
    } catch (error) {
      console.error("Error saving activityLogs to localStorage:", error);
       setToastMessageToShow({
        title: "Error de Guardado",
        description: "No se pudo guardar el historial de actividad. Revisa la consola.",
        variant: "destructive"
      });
    }
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem("celltrack_transferFolioCounter", transferFolioCounter.toString());
  }, [transferFolioCounter]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    if (transferDialogReopenTrigger > 0) {
      if (isTransferReportsDialogOpen) {
        setIsTransferReportsDialogOpen(false);
        timeoutId = setTimeout(() => {
          setIsTransferReportsDialogOpen(true);
        }, 50); 
      } else {
        setIsTransferReportsDialogOpen(true);
      }
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [transferDialogReopenTrigger]);


  const addLogEntry = (action: LogEntryAction, details: Record<string, any>) => {
    const newLogEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      user: currentUser?.name || "Sistema",
      userRole: currentUser?.role,
      details,
    };
    setActivityLogs(prevLogs => {
      const updatedLogs = [newLogEntry, ...prevLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return updatedLogs;
    });
  };

  const handleUserSelectForLogin = (userToLogin: User) => {
    setUserAttemptingLogin(userToLogin); 
    setIsUserLoginDialogOpen(true);
  };

  const handleLoginSuccess = (user: User) => { 
    setCurrentUser(user); 
    setUserAttemptingLogin(null);
    setIsUserLoginDialogOpen(false);
    let logDetails: Record<string, any> = { userName: user.name, role: user.role };
    if (user.role === 'consultas' && user.storeId) {
      const store = stores.find(s => s.id === user.storeId);
      logDetails.storeName = store?.name || user.storeId;
    }
    addLogEntry("USER_LOGIN", logDetails);
  };

  const handleLogout = () => {
    if (currentUser) {
      addLogEntry("USER_LOGOUT", { userName: currentUser.name, role: currentUser.role });
      setCurrentUser(null);
      setSearchQuery("");
      setToastMessageToShow({ title: "Sesión Cerrada", description: "Has cerrado sesión." });
    }
  };


  const handleAddProduct = (productData: Omit<ProductType, "id">) => {
    try {
      const newProduct: ProductType = { 
        ...productData, 
        id: crypto.randomUUID(),
        minimumStock: productData.minimumStock === undefined || productData.minimumStock === null ? undefined : Number(productData.minimumStock),
      };
      setProductTypes((prev) => {
        const updatedList = [...prev, newProduct].sort((a,b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
        return updatedList;
      });
      addLogEntry("PRODUCT_TYPE_ADDED", { 
        brand: newProduct.brand, 
        model: newProduct.model, 
        id: newProduct.id,
        minimumStock: newProduct.minimumStock 
      });
      setToastMessageToShow({
        title: "Tipo de Producto Registrado",
        description: `${productData.brand} ${productData.model} ha sido añadido.`,
      });
    } catch (error: any) {
        console.error("Error adding product type (client-side):", error);
        setToastMessageToShow({
            title: "Error al Guardar Producto",
            description: `No se pudo registrar el tipo de producto. Error: ${error.message || 'Error desconocido'}. Revisa la consola para más detalles.`,
            variant: "destructive",
        });
    }
  };
  
  const handleOpenSelectProductToEditDialog = () => {
    if (productTypes.length === 0) {
      setToastMessageToShow({ title: "Sin Productos", description: "No hay tipos de producto para gestionar.", variant: "destructive" });
      return;
    }
    setIsSelectProductToEditDialogOpen(true);
  };

  const handleProductSelectedForEdit = (product: ProductType) => {
    setIsSelectProductToEditDialogOpen(false);
    handleOpenEditProductTypeFlow(product);
  };
  
  const handleOpenEditProductTypeFlow = (product: ProductType) => {
    setProductToEdit(product);
    setIsEditProductAdminAuthDialogOpen(true);
  };

  const handleAdminAuthForEditProductSuccess = () => {
    setIsEditProductAdminAuthDialogOpen(false);
    if (productToEdit) {
      setIsEditProductTypeDialogOpen(true);
    } else {
      setToastMessageToShow({ title: "Error", description: "No se seleccionó ningún producto para editar.", variant: "destructive" });
    }
  };

  const handleUpdateProductType = (updatedData: { brand: string; model: string; minimumStock?: number }) => {
    if (!productToEdit) return;

    const oldProductDetails = { 
        brand: productToEdit.brand, 
        model: productToEdit.model,
        minimumStock: productToEdit.minimumStock,
    };
    
    const finalMinimumStock = updatedData.minimumStock === undefined || updatedData.minimumStock === null ? undefined : Number(updatedData.minimumStock);

    setProductTypes(prev =>
      prev.map(p =>
        p.id === productToEdit.id ? { ...p, ...updatedData, minimumStock: finalMinimumStock } : p
      ).sort((a,b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model))
    );

    addLogEntry("PRODUCT_TYPE_UPDATED", {
      productId: productToEdit.id,
      oldBrand: oldProductDetails.brand,
      oldModel: oldProductDetails.model,
      oldMinimumStock: oldProductDetails.minimumStock,
      newBrand: updatedData.brand,
      newModel: updatedData.model,
      newMinimumStock: finalMinimumStock,
    });

    setToastMessageToShow({
      title: "Tipo de Producto Actualizado",
      description: `${updatedData.brand} ${updatedData.model} ha sido actualizado.`,
    });
    setIsEditProductTypeDialogOpen(false);
    setProductToEdit(null);
  };

  const handleProductSelectedForDelete = (product: ProductType) => {
    setIsSelectProductToEditDialogOpen(false);
    setProductTypeToDelete(product);
    setIsDeleteProductAdminAuthDialogOpen(true); 
  };

  const handleAdminAuthForDeleteProductSuccess = () => {
    setIsDeleteProductAdminAuthDialogOpen(false);
    if (!productTypeToDelete) {
      setToastMessageToShow({ title: "Error", description: "No se seleccionó ningún producto para eliminar.", variant: "destructive" });
      return;
    }

    const itemsAssociated = inventoryItems.filter(item => item.productTypeId === productTypeToDelete.id);

    if (itemsAssociated.length === 0) {
      proceedWithProductTypeDeletion(productTypeToDelete);
    } else {
      const otherTypes = productTypes.filter(pt => pt.id !== productTypeToDelete.id);
      if (otherTypes.length === 0) {
        setToastMessageToShow({
          title: "Eliminación Bloqueada",
          description: `"${productTypeToDelete.brand} ${productTypeToDelete.model}" tiene ${itemsAssociated.length} artículo(s) asociado(s) y no hay otros tipos de producto para reasignarlos. Crea otro tipo de producto o elimina los artículos manualmente.`,
          variant: "destructive",
          duration: 7000,
        });
        setProductTypeToDelete(null);
        return;
      }
      setItemsToReassignDetails({
        count: itemsAssociated.length,
        productTypeId: productTypeToDelete.id,
        productName: `${productTypeToDelete.brand} ${productTypeToDelete.model}`,
        imeis: itemsAssociated.map(i => i.imei),
      });
      setOtherProductTypesForReassignment(otherTypes);
      setIsReassignItemsDialogOpen(true);
    }
  };
  
  const handleReassignItemsAndConfirmDeletion = (targetProductTypeId: string) => {
    if (!productTypeToDelete || !itemsToReassignDetails) return;

    const targetProductType = productTypes.find(pt => pt.id === targetProductTypeId);
    if (!targetProductType) {
        setToastMessageToShow({ title: "Error", description: "El tipo de producto destino no fue encontrado.", variant: "destructive" });
        return;
    }

    setInventoryItems(prevItems =>
      prevItems.map(item =>
        item.productTypeId === productTypeToDelete.id
          ? { ...item, productTypeId: targetProductTypeId }
          : item
      )
    );

    addLogEntry("ITEMS_REASSIGNED_PRODUCT_TYPE", {
      originalProductId: productTypeToDelete.id,
      originalProductBrandModel: `${productTypeToDelete.brand} ${productTypeToDelete.model}`,
      newProductId: targetProductTypeId,
      newProductBrandModel: `${targetProductType.brand} ${targetProductType.model}`,
      itemCount: itemsToReassignDetails.count,
      imeis: itemsToReassignDetails.imeis,
    } as LogEntryDetails_ITEMS_REASSIGNED);

    setToastMessageToShow({
      title: "Artículos Reasignados",
      description: `${itemsToReassignDetails.count} artículo(s) de "${productTypeToDelete.brand} ${productTypeToDelete.model}" han sido reasignados a "${targetProductType.brand} ${targetProductType.model}".`,
    });
    
    proceedWithProductTypeDeletion(productTypeToDelete, {
        newProductId: targetProductTypeId,
        newProductBrandModel: `${targetProductType.brand} ${targetProductType.model}`,
        itemCount: itemsToReassignDetails.count
    });
    
    setIsReassignItemsDialogOpen(false);
    setItemsToReassignDetails(null);
    setOtherProductTypesForReassignment([]);
  };

  const proceedWithProductTypeDeletion = (
    productToDelete: ProductType, 
    reassignmentInfo?: { newProductId: string; newProductBrandModel: string; itemCount: number }
  ) => {
    setProductTypes(prev => prev.filter(pt => pt.id !== productToDelete.id));
    
    const logDetails: LogEntryDetails_PRODUCT_TYPE_DELETED = {
      productId: productToDelete.id,
      brand: productToDelete.brand,
      model: productToDelete.model,
      minimumStock: productToDelete.minimumStock,
    };
    if (reassignmentInfo) {
      logDetails.reassignedItemsTo = reassignmentInfo;
    }
    addLogEntry("PRODUCT_TYPE_DELETED", logDetails);

    setToastMessageToShow({
      title: "Tipo de Producto Eliminado",
      description: `"${productToDelete.brand} ${productToDelete.model}" ha sido eliminado.`,
    });
    setProductTypeToDelete(null);
  };


  const handleAddMultipleItems = (itemsData: InventoryItem[]) => {
    if (itemsData.length === 0) return;

    setInventoryItems((prevItems) => {
        const prevImeis = new Set(prevItems.map(item => item.imei));
        const newUniqueItems = itemsData.filter(newItem => newItem.imei && !prevImeis.has(newItem.imei));
        const skippedCount = itemsData.length - newUniqueItems.length;

        if (skippedCount > 0) {
            setToastMessageToShow({
                title: "Artículos Omitidos",
                description: `${skippedCount} artículo(s) fueron omitidos porque sus IMEIs ya existen o faltaban en el inventario.`,
                variant: "default",
                duration: 7000,
            });
        }

        if (newUniqueItems.length === 0) {
            if (skippedCount === 0 && itemsData.length > 0) { 
                 setToastMessageToShow({
                    title: "Sin Cambios",
                    description: "No se añadieron nuevos artículos válidos.",
                    variant: "default"
                });
            } else if (itemsData.length === 0) {
                 setToastMessageToShow({
                    title: "Sin Artículos",
                    description: "No se proporcionaron artículos para añadir.",
                    variant: "default"
                });
            }
            return prevItems;
        }

        const productTypeIds = Array.from(new Set(newUniqueItems.map(item => item.productTypeId)));
        const productDetailsForLog = productTypeIds.map(ptId => {
            const productType = productTypes.find(p => p.id === ptId);
            const itemsOfThisType = newUniqueItems.filter(i => i.productTypeId === ptId);
            return {
                productTypeName: productType ? `${productType.brand} ${productType.model}` : "Desconocido",
                count: itemsOfThisType.length,
                imeis: itemsOfThisType.map(i => i.imei),
                status: itemsOfThisType[0]?.status, 
                color: itemsOfThisType[0]?.color,   
            };
        });

        addLogEntry("ITEM_ADDED", {
            count: newUniqueItems.length,
            items: productDetailsForLog,
        });

        setToastMessageToShow({
            title: `${newUniqueItems.length} Artículo(s) Añadido(s)`,
            description: `Se han añadido ${newUniqueItems.length} nuevos artículos al inventario.`,
        });

        return [...prevItems, ...newUniqueItems].sort((a, b) => a.imei.localeCompare(b.imei));
    });
};


  const existingImeis = useMemo(() => inventoryItems.map(item => item.imei), [inventoryItems]);
  const allInventoryImeisForSelection = useMemo(() => inventoryItems.map(item => item.imei), [inventoryItems]);

  const activeInventoryItems = useMemo(() => inventoryItems.filter(item => item.status !== "Vendido" && item.status !== "Perdido"), [inventoryItems]);

  const filteredInventory = useMemo(() => {
    const searchTerm = searchQuery.toLowerCase().trim();
    const isSearchingForSold = searchTerm.includes("vendido");
    const isSearchingForLost = searchTerm.includes("perdido");

    return inventoryItems.filter(item => {
      if (item.status === "Vendido") {
        if (searchTerm.length === 0) return false; 
        if (!isSearchingForSold && searchTerm.length > 0) return false; 
      }
      if (item.status === "Perdido") {
        if (searchTerm.length === 0) return false; 
        if (!isSearchingForLost && searchTerm.length > 0) return false; 
      }

      const productType = productTypes.find(pt => pt.id === item.productTypeId);
      const store = stores.find(s => s.id === item.storeId);

      const storeMatch = selectedStoreFilter === "all" || item.storeId === selectedStoreFilter;
      const modelMatch = selectedModelFilter === "all" || (productType && productType.model === selectedModelFilter);

      let searchMatch = true;
      if (searchTerm) {
        searchMatch =
          item.imei?.toLowerCase().includes(searchTerm) ||
          (item.imei2 && item.imei2.toLowerCase().includes(searchTerm)) ||
          productType?.brand?.toLowerCase().includes(searchTerm) ||
          productType?.model?.toLowerCase().includes(searchTerm) ||
          item.memory?.toLowerCase().includes(searchTerm) ||
          item.color?.toLowerCase().includes(searchTerm) ||
          item.supplier?.toLowerCase().includes(searchTerm) ||
          item.purchaseInvoiceId?.toLowerCase().includes(searchTerm) ||
          item.status?.toLowerCase().includes(searchTerm) ||
          store?.name?.toLowerCase().includes(searchTerm);
      }
      return storeMatch && modelMatch && searchMatch;
    });
  }, [inventoryItems, productTypes, stores, selectedStoreFilter, selectedModelFilter, searchQuery]);

  const handleToggleSelectItem = (imei: string) => {
    if (currentUser?.role === 'consultas') return;
    setSelectedItemImeis(prevSelected =>
      prevSelected.includes(imei)
        ? prevSelected.filter(id => id !== imei)
        : [...prevSelected, imei]
    );
  };

  const handleToggleSelectAll = () => {
    if (currentUser?.role === 'consultas') return;
    if (selectedItemImeis.length === filteredInventory.length && filteredInventory.length > 0) {
      setSelectedItemImeis([]);
    } else {
      setSelectedItemImeis(filteredInventory.map(item => item.imei));
    }
  };

  const handleOpenBulkChangeStatus = () => {
    if (selectedItemImeis.length > 0) {
      setIsBulkChangeStatusDialogOpen(true);
    } else {
      setToastMessageToShow({ title: "Sin selección", description: "Selecciona al menos un artículo para cambiar su estatus.", variant: "destructive" });
    }
  };

  const handleOpenBulkTransfer = () => {
    if (selectedItemImeis.length > 0) {
      setIsBulkTransferDialogOpen(true);
    } else {
      setToastMessageToShow({ title: "Sin selección", description: "Selecciona al menos un artículo para transferir.", variant: "destructive" });
    }
  };

  const handleOpenDeleteConfirmation = () => {
    if (selectedItemImeis.length > 0) {
      setIsDeleteItemConfirmationDialogOpen(true);
    } else {
      setToastMessageToShow({ title: "Sin selección", description: "Selecciona al menos un artículo para eliminar.", variant: "destructive" });
    }
  };

  const handleOpenBulkSelectByImeiDialog = () => {
    setIsBulkSelectByImeiDialogOpen(true);
  };

  const handleImeisProcessedForBulkAction = (identifiedImeis: string[]) => {
    setIsBulkSelectByImeiDialogOpen(false);
    if (identifiedImeis.length > 0) {
      setSelectedItemImeis(identifiedImeis);
      setToastMessageToShow({
        title: "Selección Rápida Exitosa",
        description: `${identifiedImeis.length} artículo(s) válido(s) han sido seleccionados. Ahora puedes cambiar su estatus o transferirlos usando los botones de acciones en lote.`,
      });
    } else {
      setToastMessageToShow({
        title: "Sin Coincidencias",
        description: "Ninguno de los IMEIs procesados se encontró en el inventario o la lista estaba vacía.",
        variant: "destructive",
      });
      setSelectedItemImeis([]); 
    }
  };
  
  const handleOpenSelectedItemDetailsDialog = () => {
    if (selectedItemImeis.length > 0) {
      setIsSelectedItemDetailsDialogOpen(true);
    } else {
      setToastMessageToShow({ title: "Sin selección", description: "Selecciona al menos un artículo para ver sus detalles.", variant: "destructive" });
    }
  };

  const selectedItemsDetails = useMemo(() => {
    return inventoryItems.filter(item => selectedItemImeis.includes(item.imei));
  }, [inventoryItems, selectedItemImeis]);


  const applyBulkStatusChange = (imeisToUpdate: string[], newStatus: ItemStatus) => {
    const itemsToUpdateDetails = inventoryItems
      .filter(item => imeisToUpdate.includes(item.imei))
      .map(item => ({ imei: item.imei, oldStatus: item.status }));

    setInventoryItems(prevItems =>
      prevItems.map(item =>
        imeisToUpdate.includes(item.imei) ? { ...item, status: newStatus } : item
      )
    );
    addLogEntry("ITEMS_STATUS_CHANGED", {
      imeis: imeisToUpdate,
      newStatus: newStatus,
      count: imeisToUpdate.length,
      changedItems: itemsToUpdateDetails.map(i => ({ ...i, newStatus }))
    });
    setToastMessageToShow({
      title: "Estatus Actualizado en Lote",
      description: `${imeisToUpdate.length} artículo(s) actualizado(s) a "${newStatus}".`,
    });
    setSelectedItemImeis([]);
  };

  const handleBulkChangeStatusAction = (newStatus: ItemStatus) => {
    if (newStatus === "Perdido") {
      setPendingStatusChange({ newStatus: "Perdido", imeis: [...selectedItemImeis] });
      setIsBulkChangeStatusDialogOpen(false);
      setIsConfirmLostStatusAdminAuthDialogOpen(true);
    } else {
      applyBulkStatusChange([...selectedItemImeis], newStatus);
      setIsBulkChangeStatusDialogOpen(false);
    }
  };

  const handleAdminAuthForLostStatusSuccess = () => {
    if (pendingStatusChange) {
      applyBulkStatusChange(pendingStatusChange.imeis, pendingStatusChange.newStatus);
    }
    setIsConfirmLostStatusAdminAuthDialogOpen(false);
    setPendingStatusChange(null);
  };

  const generateNewTransferFolio = (): string => {
    const newFolio = `TR-${String(transferFolioCounter).padStart(5, '0')}`;
    setTransferFolioCounter(prev => prev + 1);
    return newFolio;
  };

  const handleBulkTransferAction = (targetStoreId: string) => {
    const targetStore = stores.find(s => s.id === targetStoreId);
    if (!targetStore || !currentUser) {
        setToastMessageToShow({ title: "Error", description: "Tienda de destino no encontrada o usuario no autenticado.", variant: "destructive" });
        return;
    }
    const itemsToTransfer = inventoryItems.filter(item => selectedItemImeis.includes(item.imei));

    const originalStores: Record<string, string | undefined> = {};
    const reportItemDetails: TransferReportItemDetail[] = itemsToTransfer.map(item => {
      const product = productTypes.find(pt => pt.id === item.productTypeId);
      const originalStore = stores.find(s => s.id === item.storeId);
      originalStores[item.imei] = item.storeId;
      return {
        imei: item.imei,
        productTypeName: product ? `${product.brand} ${product.model}` : "Desconocido",
        originalStoreName: originalStore?.name || "N/A",
        color: item.color,
      };
    });

    const newTransferFolio = generateNewTransferFolio();
    const initiatorUserName = currentUser.name;
    let initialTransferState: LogEntryDetails_ITEMS_TRANSFERRED['transferState'] = 'pending_admin_confirmation';

    const transferReportText = generateTransferReportText(
        reportItemDetails,
        targetStore.name,
        newTransferFolio,
        initiatorUserName,
        initialTransferState, 
        undefined, 
        undefined 
    );

    setInventoryItems(prevItems =>
      prevItems.map(item =>
        selectedItemImeis.includes(item.imei) ? { ...item, storeId: targetStoreId } : item
      )
    );

    const logDetails: LogEntryDetails_ITEMS_TRANSFERRED = {
        transferFolio: newTransferFolio,
        imeis: selectedItemImeis,
        targetStoreId: targetStoreId,
        targetStoreName: targetStore.name,
        count: selectedItemImeis.length,
        originalStores: originalStores,
        report: transferReportText,
        transferState: initialTransferState,
        initiatorUserName: initiatorUserName,
        adminConfirmedBy: undefined, 
        adminConfirmationTimestamp: undefined,
        consultasUserConfirmedBy: undefined,
        consultasUserConfirmationTimestamp: undefined,
        reportItemDetailsForConfirmation: reportItemDetails,
    };
    addLogEntry("ITEMS_TRANSFERRED", logDetails);

    let toastDescriptionText = `${selectedItemImeis.length} artículo(s) transferido(s) a ${targetStore.name}. Folio: ${newTransferFolio}. `;
    toastDescriptionText += `Estado: PENDIENTE CONFIRMACIÓN ADMIN.`;


    setToastMessageToShow({
      title: "Transferencia en Lote Iniciada",
      description: (
        <div className="w-full text-sm">
          <p className="mb-2">{toastDescriptionText}</p>
          <p className="mb-1 font-semibold">Reporte para copiar:</p>
          <textarea
            readOnly
            className="w-full h-40 p-2 border rounded-md text-xs bg-muted/50 font-mono focus:ring-0 focus:outline-none"
            value={transferReportText}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
        </div>
      ),
      duration: 30000,
    });
    setSelectedItemImeis([]);
    setIsBulkTransferDialogOpen(false);
  };

  const handleConfirmTransferReception = (logIdToConfirm: string, confirmationType: 'admin' | 'consultas') => {
    if (!currentUser) {
        setToastMessageToShow({ title: "Error", description: "Debes iniciar sesión.", variant: "destructive" });
        return;
    }

    const originalLogIndex = activityLogs.findIndex(log => log.id === logIdToConfirm && log.action === "ITEMS_TRANSFERRED");
    if (originalLogIndex === -1) {
        setToastMessageToShow({ title: "Error", description: "Transferencia no encontrada.", variant: "destructive"});
        return;
    }
    const originalLog = activityLogs[originalLogIndex];
    let details = originalLog.details as LogEntryDetails_ITEMS_TRANSFERRED;

    if (confirmationType === 'admin') {
        if (currentUser.role !== 'admin') {
            setToastMessageToShow({ title: "Acción no permitida", description: "Solo un administrador puede hacer esta confirmación.", variant: "destructive" }); return;
        }
        if (details.transferState !== 'pending_admin_confirmation' && details.adminConfirmedBy) {
             setToastMessageToShow({ title: "Acción no permitida", description: "La transferencia no está pendiente de confirmación por admin o ya fue confirmada por un admin.", variant: "destructive"}); return;
        }
    } else if (confirmationType === 'consultas') {
        if (currentUser.role !== 'consultas') {
            setToastMessageToShow({ title: "Acción no permitida", description: "Solo un usuario de consultas puede hacer esta confirmación.", variant: "destructive" }); return;
        }
        if (currentUser.storeId !== details.targetStoreId) { 
            setToastMessageToShow({ title: "Acción no permitida", description: "Esta transferencia no es para la tienda con la que has iniciado sesión.", variant: "destructive"}); return;
        }
        if (details.transferState !== 'pending_consultas_confirmation' || !details.adminConfirmedBy) {
             setToastMessageToShow({ title: "Acción no permitida", description: "El administrador debe confirmar primero o la transferencia no está pendiente de consultas.", variant: "destructive" }); return;
        }
    }


    const now = new Date().toISOString();
    const updatedDetails: Partial<LogEntryDetails_ITEMS_TRANSFERRED> = {};
    let newTransferState = details.transferState;
    let reportAdminConfirmer = details.adminConfirmedBy;
    let reportConsultasConfirmer = details.consultasUserConfirmedBy;

    if (confirmationType === 'admin') {
        updatedDetails.adminConfirmedBy = currentUser.name;
        updatedDetails.adminConfirmationTimestamp = now;
        reportAdminConfirmer = currentUser.name;
        newTransferState = 'pending_consultas_confirmation'; 

    } else if (confirmationType === 'consultas') {
        updatedDetails.consultasUserConfirmedBy = currentUser.name;
        updatedDetails.consultasUserConfirmationTimestamp = now;
        reportConsultasConfirmer = currentUser.name;
        if (details.adminConfirmedBy || reportAdminConfirmer) { 
             newTransferState = 'completed';
        } else {
            setToastMessageToShow({ title: "Error de Flujo", description: "Admin debe confirmar antes que consultas.", variant: "destructive" });
            return;
        }
    }

    updatedDetails.transferState = newTransferState;

    const reportDetailsForGeneration = {
      ...details, 
      ...updatedDetails 
    };


    updatedDetails.report = generateTransferReportText(
        reportDetailsForGeneration.reportItemDetailsForConfirmation || [],
        reportDetailsForGeneration.targetStoreName || 'Desconocida',
        reportDetailsForGeneration.transferFolio,
        reportDetailsForGeneration.initiatorUserName,
        newTransferState, 
        reportAdminConfirmer,
        reportConsultasConfirmer,
        reportDetailsForGeneration.cancelledBy,
        reportDetailsForGeneration.cancellationTimestamp
    );

    const newLogs = [...activityLogs];
    const updatedLog = {
      ...originalLog,
      details: { ...originalLog.details, ...updatedDetails }
    };
    newLogs[originalLogIndex] = updatedLog;
    setActivityLogs(newLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    addLogEntry("TRANSFER_CONFIRMED", {
        originalTransferLogId: logIdToConfirm,
        transferFolio: details.transferFolio,
        confirmedBy: currentUser.name,
        confirmationType: confirmationType,
        targetStoreName: details.targetStoreName,
        itemCount: details.count,
        imeis: details.imeis,
        role: currentUser.role,
    } as LogEntryDetails_TRANSFER_CONFIRMED);
    
    
    setTimeout(() => {
        setToastMessageToShow({ title: `Confirmación de ${confirmationType} Registrada (Folio: ${details.transferFolio})`, description: `Transferencia a ${details.targetStoreName} actualizada.` });
        if (newTransferState === 'completed') {
            setToastMessageToShow({ title: `Transferencia Completada (Folio: ${details.transferFolio})`, description: `La transferencia a ${details.targetStoreName} ha sido completada.` });
        }
        setIsTransferReportsDialogOpen(false);
        setTransferDialogReopenTrigger(prev => prev + 1);
    }, 0);
  };


  const handleCancelTransfer = (logIdToCancel: string) => {
    if (currentUser?.role !== 'admin') {
        setToastMessageToShow({ title: "Acción no permitida", description: "Solo un administrador puede cancelar una transferencia.", variant: "destructive" });
        return;
    }

    const originalLogIndex = activityLogs.findIndex(log => log.id === logIdToCancel && log.action === "ITEMS_TRANSFERRED");
    if (originalLogIndex === -1) {
        setToastMessageToShow({ title: "Error", description: "Transferencia no encontrada para cancelar.", variant: "destructive"});
        return;
    }
    const originalLog = activityLogs[originalLogIndex];
    let details = originalLog.details as LogEntryDetails_ITEMS_TRANSFERRED;

    if (details.transferState === 'completed' || details.transferState === 'cancelled') {
        setToastMessageToShow({ title: "Acción no permitida", description: `La transferencia ya está ${details.transferState}.`, variant: "destructive"});
        return;
    }

    
    const updatedInventoryItems = inventoryItems.map(item => {
        if (details.imeis.includes(item.imei)) {
            const originalStoreId = details.originalStores[item.imei];
            if (originalStoreId) {
                return { ...item, storeId: originalStoreId };
            }
        }
        return item;
    });
    setInventoryItems(updatedInventoryItems);

    
    const now = new Date().toISOString();
    const updatedTransferLogDetails: Partial<LogEntryDetails_ITEMS_TRANSFERRED> = {
        transferState: 'cancelled',
        cancelledBy: currentUser.name,
        cancellationTimestamp: now,
    };
    
    updatedTransferLogDetails.report = generateTransferReportText(
        details.reportItemDetailsForConfirmation || [],
        details.targetStoreName || 'Desconocida',
        details.transferFolio,
        details.initiatorUserName,
        'cancelled', 
        details.adminConfirmedBy,
        details.consultasUserConfirmedBy,
        currentUser.name, 
        now 
    );

    const newLogs = [...activityLogs];
    newLogs[originalLogIndex] = {
        ...originalLog,
        details: { ...originalLog.details, ...updatedTransferLogDetails }
    };
    setActivityLogs(newLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    
    addLogEntry("TRANSFER_CANCELLED", {
        transferFolio: details.transferFolio,
        cancelledBy: currentUser.name,
        originalTargetStoreName: details.targetStoreName || "Desconocida",
        itemCount: details.count,
        imeis: details.imeis,
    } as LogEntryDetails_TRANSFER_CANCELLED);

    setTimeout(() => {
        setToastMessageToShow({
            title: "Transferencia Cancelada",
            description: `La transferencia con folio ${details.transferFolio} ha sido cancelada y los artículos devueltos a sus tiendas originales.`,
        });
        setIsTransferReportsDialogOpen(false);
        setTransferDialogReopenTrigger(prev => prev + 1);
    }, 0);
  };


  const handleConfirmDeleteItemsAction = (password: string) => {
    if (password !== REQUIRED_PASSWORD_FOR_ACTIONS) {
      setToastMessageToShow({
        title: "Contraseña Incorrecta",
        description: "No se pudieron eliminar los artículos.",
        variant: "destructive",
      });
      return;
    }
    const itemsToDeleteDetails = inventoryItems
        .filter(item => selectedItemImeis.includes(item.imei))
        .map(item => {
            const product = productTypes.find(pt => pt.id === item.productTypeId);
            const store = stores.find(s => s.id === item.storeId);
            return {
                imei: item.imei,
                product: product ? `${product.brand} ${product.model}` : "Desconocido",
                store: store ? store.name : "Desconocida",
                status: item.status,
                memory: item.memory,
                color: item.color,
                supplier: item.supplier,
            };
        });

    setInventoryItems(prevItems =>
      prevItems.filter(item => !selectedItemImeis.includes(item.imei))
    );
    addLogEntry("ITEMS_DELETED", {
      count: selectedItemImeis.length,
      deletedItems: itemsToDeleteDetails
    });
    setToastMessageToShow({
      title: "Artículos Eliminados",
      description: `${selectedItemImeis.length} artículo(s) han sido eliminados del inventario.`,
    });
    setSelectedItemImeis([]);
    setIsDeleteItemConfirmationDialogOpen(false);
  };

  const handleOpenActivityLogDialog = () => {
    setIsActivityLogDialogOpen(true);
  };

  const handleOpenTransferReportsDialog = () => {
    setIsTransferReportsDialogOpen(true);
  };
  
  const handleOpenDatabaseManagementDialog = () => {
    setIsDatabaseManagementDialogOpen(true);
  };

  const handleOpenInventoryReportsDialog = () => {
    setIsInventoryReportsDialogOpen(true);
  };

  const handleOpenSoldItemsReportDialog = () => {
    setIsSoldItemsReportDialogOpen(true);
  };

  const handleOpenCompareImeiListsDialog = () => { 
    setIsCompareImeiListsDialogOpen(true);
  };


  const handleDownloadBackup = () => {
    try {
      const backupData = {
        productTypes,
        inventoryItems,
        activityLogs,
        transferFolioCounter,
        backupVersion: "1.0",
        backupTimestamp: new Date().toISOString(),
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      link.download = `celltrack_backup_${formattedDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToastMessageToShow({ title: "Backup Descargado", description: "La base de datos local se ha descargado." });
    } catch (error) {
      console.error("Error al descargar backup:", error);
      setToastMessageToShow({ title: "Error de Backup", description: "No se pudo generar el archivo de backup.", variant: "destructive" });
    }
  };

  const handleUploadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const parsedData = JSON.parse(text);
            
            if (
              parsedData &&
              Array.isArray(parsedData.productTypes) &&
              Array.isArray(parsedData.inventoryItems) &&
              Array.isArray(parsedData.activityLogs) &&
              typeof parsedData.transferFolioCounter === 'number'
            ) {
              let restoredProductTypes: ProductType[] = parsedData.productTypes.map((pt: any) => ({
                id: pt.id,
                brand: pt.brand,
                model: pt.model,
                minimumStock: pt.minimumStock === undefined || pt.minimumStock === null ? undefined : Number(pt.minimumStock),
              }));
              let restoredInventoryItems: InventoryItem[] = parsedData.inventoryItems.map((item: any) => ({
                ...item,
                purchasePrice: Number(item.purchasePrice) || 0,
                purchaseInvoiceDate: item.purchaseInvoiceDate || new Date().toISOString().split("T")[0],
                status: item.status || "Nuevo",
              }));
              let restoredActivityLogs: LogEntry[] = parsedData.activityLogs;

              const uniqueProductTypes = [];
              const seenProductTypeIds = new Set();
              for (const pt of restoredProductTypes) {
                  if (pt.id && !seenProductTypeIds.has(pt.id)) {
                      uniqueProductTypes.push(pt);
                      seenProductTypeIds.add(pt.id);
                  } else if (!pt.id) { 
                      uniqueProductTypes.push({...pt, id: crypto.randomUUID()});
                  } else {
                       // console.warn(`Duplicate ProductType ID "${pt.id}" found in backup. Skipping.`);
                  }
              }
              restoredProductTypes = uniqueProductTypes;


              const uniqueInventoryItems: InventoryItem[] = [];
              const seenImeis = new Set<string>();
              for (const item of restoredInventoryItems) {
                if (item.imei && !seenImeis.has(item.imei)) {
                  uniqueInventoryItems.push(item);
                  seenImeis.add(item.imei);
                } else {
                  // console.warn(`Duplicate or invalid IMEI "${item.imei}" found in backup. Skipping.`);
                }
              }
              restoredInventoryItems = uniqueInventoryItems;
              
              setProductTypes(restoredProductTypes.sort((a,b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model)));
              setInventoryItems(restoredInventoryItems.sort((a, b) => a.imei.localeCompare(b.imei)));
              setActivityLogs(restoredActivityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
              setTransferFolioCounter(parsedData.transferFolioCounter);

              setToastMessageToShow({ title: "Restauración Exitosa", description: "La base de datos local ha sido restaurada desde el backup." });
              setIsDatabaseManagementDialogOpen(false);
            } else {
              setToastMessageToShow({ title: "Archivo Inválido", description: "El archivo de backup no tiene el formato esperado o faltan datos esenciales.", variant: "destructive" });
            }
          }
        } catch (error) {
          console.error("Error al cargar backup:", error);
          setToastMessageToShow({ title: "Error de Restauración", description: "No se pudo leer o parsear el archivo de backup.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }
  };

  const totalInventoryCount = activeInventoryItems.length;
  

  const detailedStoreSummaries = useMemo(() => {
    const summaries: DetailedStoreSummary[] = [];

    for (const store of stores) {
      const itemsInStore = activeInventoryItems.filter(item => item.storeId === store.id);
      const totalActiveCount = itemsInStore.length;
      const productsBreakdown: Record<string, number> = {}; 

      for (const item of itemsInStore) {
        productsBreakdown[item.productTypeId] = (productsBreakdown[item.productTypeId] || 0) + 1;
      }

      const productsList: StoreProductBreakdown[] = Object.entries(productsBreakdown)
        .map(([productTypeId, count]) => {
          const productType = productTypes.find(pt => pt.id === productTypeId);
          return {
            productTypeName: productType ? `${productType.brand} ${productType.model}` : "Desconocido",
            count,
          };
        })
        .sort((a, b) => a.count - b.count); 

      summaries.push({
        storeId: store.id,
        storeName: store.name,
        totalActiveCount,
        products: productsList,
      });
    }
    return summaries.sort((a,b) => a.storeName.localeCompare(b.storeName));
  }, [activeInventoryItems, stores, productTypes]);

  const generateWindowHtml = (title: string, reportContent: string) => {
    return `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Inter, sans-serif; line-height: 1.6; padding: 20px; margin:0; background-color: #f9fafb; color: #1f2937; }
            .container { max-width: 800px; margin: 20px auto; background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #2563eb; font-size: 1.5em; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top:0; }
            h2 { font-size: 1.25em; color: #374151; margin-top: 20px; margin-bottom: 10px; }
            h3 { font-size: 1.1em; color: #4b5563; margin-top: 15px; margin-bottom: 5px; }
            ul { list-style-type: none; padding-left: 0; }
            li { margin-bottom: 0.5rem; padding: 0.25rem 0; border-bottom: 1px solid #f3f4f6; }
            li:last-child { border-bottom: none; }
            li ul { padding-left: 20px; margin-top: 0.25rem; }
            li ul li { font-size: 0.9em; border-bottom: none; }
            .product-item { display: flex; justify-content: space-between; align-items: center; }
            .product-item > span:first-child { flex-grow: 1; }
            .product-item > span:last-child { text-align: right; min-width: 150px; }
            .stock-low-warning { color: #FFAB40; font-weight: bold; }
            .stock-low-warning::before { content: "⚠️ "; }
            button {
              padding: 10px 15px; font-size: 0.9em; color: white; background-color: #2563eb; border: none; border-radius: 6px; cursor: pointer; transition: background-color 0.2s; margin-bottom: 20px;
            }
            button:hover { background-color: #1d4ed8; }
            .report-header { margin-bottom: 15px; font-size: 0.9em; color: #6b7280; }
            pre { background-color: #f3f4f6; padding: 15px; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 0.9em; border: 1px solid #d1d5db; }
          </style>
        </head>
        <body>
          <div class="container">
            <button id="copyReportButton">Copiar Reporte</button>
            <h1>${title}</h1>
            <div class="report-header">Generado: ${format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es })}</div>
            <div id="reportTextContainer">
              ${reportContent}
            </div>
          </div>
          <script>
            document.getElementById('copyReportButton').addEventListener('click', function() {
              const reportHtml = document.getElementById('reportTextContainer').innerText; // Use innerText for plain text
              if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(reportHtml).then(function() {
                  alert('¡Reporte copiado al portapapeles!');
                }, function(err) {
                  alert('Error al copiar el reporte: ' + err);
                });
              } else {
                try {
                  const textArea = document.createElement('textarea');
                  textArea.value = reportHtml;
                  textArea.style.position = 'fixed';
                  document.body.appendChild(textArea);
                  textArea.focus();
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  alert('¡Reporte copiado al portapapeles! (modo fallback)');
                } catch (e) {
                  alert('No se pudo copiar el reporte. Por favor, cópialo manualmente.');
                }
              }
            });
          </script>
        </body>
      </html>
    `;
  };
  
  const handleOpenStoreSummaryWindow = () => {
    if (detailedStoreSummaries.length === 0) {
        toast({ title: "Sin Datos", description: "No hay tiendas con inventario activo para mostrar.", variant: "default" });
        return;
    }

    let summaryContent = `<h2>Total Artículos Activos General: ${totalInventoryCount}</h2>`;
    
    detailedStoreSummaries.forEach(summary => {
        summaryContent += `
            <div>
                <h3>${summary.storeName} (Total: ${summary.totalActiveCount} art.)</h3>`;
        if (summary.products.length === 0) {
            summaryContent += "<p><em>No hay productos activos en esta tienda.</em></p>";
        } else {
            summaryContent += "<ul>";
            summary.products.forEach(prod => {
                summaryContent += `<li class="product-item"><span>${prod.productTypeName}</span> <span>${prod.count} art.</span></li>`;
            });
            summaryContent += "</ul>";
        }
        summaryContent += "</div><hr style='margin: 15px 0; border: 0; border-top: 1px solid #e5e7eb;'/>";
    });
    
    const htmlReport = generateWindowHtml("Resumen de Tiendas (Inventario Activo)", summaryContent);
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(htmlReport);
      newWindow.document.close();
    } else {
      toast({ title: "Error al Abrir Ventana", description: "No se pudo abrir la ventana del reporte. Revisa el bloqueador de pop-ups.", variant: "destructive" });
    }
  };

  const handleOpenProductTypeSummaryWindow = () => {
    if (productTypes.length === 0) {
        toast({ title: "Sin Datos", description: "No hay tipos de producto para mostrar.", variant: "default" });
        return;
    }
    const productCounts = productTypes.map(pt => ({
        ...pt,
        count: activeInventoryItems.filter(item => item.productTypeId === pt.id).length
    })).sort((a,b) => {
        if (a.count !== b.count) return a.count - b.count;
        const brandCompare = a.brand.localeCompare(b.brand);
        if (brandCompare !== 0) return brandCompare;
        return a.model.localeCompare(b.model);
    });

    let summaryContent = `<h2>Total Artículos Activos General: ${totalInventoryCount}</h2>`;
    summaryContent += "<ul>";
    productCounts.forEach(pt => {
        let warningClass = "";
        const minimumStockText = pt.minimumStock !== undefined ? String(pt.minimumStock) : "N/A";
        if (pt.minimumStock !== undefined && pt.count < pt.minimumStock) {
            warningClass = "stock-low-warning";
        }
        summaryContent += `<li class="product-item ${warningClass}">
                             <span>${pt.brand} ${pt.model}</span>
                             <span>Actual: ${pt.count} | Mínimo: ${minimumStockText}</span>
                           </li>`;
    });
    summaryContent += "</ul>";

    const htmlReport = generateWindowHtml("Resumen de Tipos de Producto (Inventario Activo)", summaryContent);
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(htmlReport);
      newWindow.document.close();
    } else {
      toast({ title: "Error al Abrir Ventana", description: "No se pudo abrir la ventana del reporte. Revisa el bloqueador de pop-ups.", variant: "destructive" });
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader
        currentUser={currentUser}
        adminUsers={ADMIN_USERS_DATA}
        consultasUsers={CONSULTAS_USERS_DATA} 
        stores={stores}
        onUserSelect={handleUserSelectForLogin}
        onLogout={handleLogout}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {!currentUser && (
          <Alert variant="default" className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Iniciar Sesión Requerido</AlertTitle>
            <AlertDescription>
              Por favor, selecciona un tipo de usuario y tus credenciales para habilitar funcionalidades.
            </AlertDescription>
          </Alert>
        )}

        {currentUser && (
          <Card className="mb-6 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Info className="mr-2 h-5 w-5 text-primary" />
                Resumen General del Inventario (Activo)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base font-semibold mb-3">
                Total de Equipos en Inventario Activo: {totalInventoryCount}
              </p>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="store-summary">
                  <AccordionTrigger className="text-md font-medium hover:no-underline">
                     Equipos Activos por Sucursal
                  </AccordionTrigger>
                  <AccordionContent>
                    {detailedStoreSummaries.length === 0 ? (
                      <p className="text-sm text-muted-foreground pt-2">No hay tiendas con inventario activo.</p>
                    ) : (
                      <ul className="space-y-2 text-sm list-inside pt-2">
                        {detailedStoreSummaries.map(summary => (
                           <li key={summary.storeId}>
                            <Accordion type="single" collapsible className="w-full text-sm -ml-2">
                                <AccordionItem value={`store-${summary.storeId}-details`} className="border-b-0">
                                <AccordionTrigger className="hover:no-underline py-1.5 px-2 rounded hover:bg-muted/50">
                                    <div className="flex justify-between w-full">
                                    <span>{summary.storeName}:</span>
                                    <span className="font-medium">{summary.totalActiveCount} art.</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-1">
                                    {summary.products.length === 0 ? (
                                    <p className="text-xs text-muted-foreground pl-6 pt-1">No hay productos en esta tienda.</p>
                                    ) : (
                                    <ul className="space-y-0.5 text-xs pl-8 pt-1">
                                        {summary.products.map(prod => (
                                        <li key={prod.productTypeName} className="flex justify-between">
                                            <span>{prod.productTypeName}</span>
                                            <span className="font-normal">{prod.count}</span>
                                        </li>
                                        ))}
                                    </ul>
                                    )}
                                </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}

        {isAdminRole && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="md:col-span-1 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Resúmenes Detallados</CardTitle>
                 <CardDescription>Visualiza el inventario por tienda o producto.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-3">
                 <Button onClick={handleOpenStoreSummaryWindow} className="w-full justify-start" disabled={isAnyActionDisabled || !isAdminRole}>
                  <Warehouse className="mr-2 h-5 w-5" /> Ver Resumen de Tiendas
                </Button>
                <Button onClick={handleOpenProductTypeSummaryWindow} className="w-full justify-start" disabled={isAnyActionDisabled || !isAdminRole}>
                  <Shapes className="mr-2 h-5 w-5" /> Ver Resumen de Tipos de Producto 
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Acciones Rápidas</CardTitle>
                <CardDescription>Gestiona tu inventario rápidamente.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-3">
                <Button onClick={() => setIsAddProductDialogOpen(true)} className="w-full justify-start" disabled={isAnyActionDisabled || !isAdminRole}>
                  <PackagePlus className="mr-2 h-5 w-5" /> Registrar Tipo de Producto
                </Button>
                <Button onClick={handleOpenSelectProductToEditDialog} className="w-full justify-start" disabled={isAnyActionDisabled || !isAdminRole || productTypes.length === 0}>
                  <Pencil className="mr-2 h-5 w-5" /> Gestionar Tipos de Producto
                </Button>
                <Button onClick={() => setIsAddItemDialogOpen(true)} className="w-full justify-start" disabled={isAnyActionDisabled || !isAdminRole}>
                  <ListPlus className="mr-2 h-5 w-5" /> Añadir Artículo(s) a Inventario
                </Button>
                 <Button onClick={handleOpenInventoryReportsDialog} className="w-full justify-start" disabled={isAnyActionDisabled || !isAdminRole}>
                  <FileSpreadsheet className="mr-2 h-5 w-5" /> Reportes de Inventario
                </Button>
                <Button onClick={handleOpenSoldItemsReportDialog} className="w-full justify-start" disabled={isAnyActionDisabled || !isAdminRole}>
                  <DollarSign className="mr-2 h-5 w-5" /> Reporte de Ventas
                </Button>
                <Button onClick={handleOpenCompareImeiListsDialog} className="w-full justify-start" disabled={isAnyActionDisabled || !isAdminRole}>
                  <GitCompareArrows className="mr-2 h-5 w-5" /> Cotejar Listas de IMEIs
                </Button>
                <Button onClick={handleOpenActivityLogDialog} className="w-full justify-start" disabled={isAnyActionDisabled || !isAdminRole}>
                  <BookText className="mr-2 h-5 w-5" /> Ver Log de Actividad
                </Button>
                <Button onClick={handleOpenTransferReportsDialog} className="w-full justify-start" disabled={isAnyActionDisabled}>
                  <ClipboardList className="mr-2 h-5 w-5" /> Ver Reportes de Transferencia
                </Button>
                <Button onClick={handleOpenDatabaseManagementDialog} className="w-full justify-start" disabled={isAnyActionDisabled || !isAdminRole}>
                  <Database className="mr-2 h-5 w-5" /> Backup y Restauración Local
                </Button>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-1 shadow-lg"> 
              <CardHeader>
                  <CardTitle className="text-xl">Información Adicional</CardTitle>
                  <CardDescription>Espacio para futuras estadísticas o notas.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-muted-foreground">Próximamente más funcionalidades aquí.</p>
              </CardContent>
            </Card>

          </div>
        )}

        {isConsultasRole && currentUser && (
             <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Acciones Disponibles para {currentUser.storeId ? stores.find(s=>s.id === currentUser.storeId)?.name : 'Consultas'}</CardTitle>
                 <CardDescription>Como usuario de consulta, puedes ver y confirmar los reportes de transferencia pendientes para tu tienda seleccionada.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-3">
                 <Button onClick={handleOpenTransferReportsDialog} className="w-full justify-start" disabled={isAnyActionDisabled}>
                  <ClipboardList className="mr-2 h-5 w-5" /> Ver y Confirmar Reportes de Transferencia
                </Button>
              </CardContent>
            </Card>
        )}

        {isAdminRole && currentUser && (
          <>
            <InventorySearchBar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />

            {!isSearching && (
              <InventoryFilters
                stores={stores}
                productTypes={productTypes}
                selectedStore={selectedStoreFilter}
                onStoreChange={setSelectedStoreFilter}
                selectedModel={selectedModelFilter}
                onModelChange={setSelectedModelFilter}
              />
            )}

            <BulkActionsBar
              selectedCount={selectedItemImeis.length}
              onBulkChangeStatus={handleOpenBulkChangeStatus}
              onBulkTransfer={handleOpenBulkTransfer}
              onBulkDelete={handleOpenDeleteConfirmation}
              onOpenBulkSelectByImei={handleOpenBulkSelectByImeiDialog}
              onShowDetails={handleOpenSelectedItemDetailsDialog}
              disabled={isAnyActionDisabled || !isAdminRole}
            />

            <InventoryTable
              items={filteredInventory}
              productTypes={productTypes}
              stores={stores}
              selectedItemImeis={selectedItemImeis}
              onToggleSelectItem={handleToggleSelectItem}
              onToggleSelectAll={handleToggleSelectAll}
              actionsDisabled={isAnyActionDisabled || currentUser?.role === 'consultas'}
              currentUserRole={currentUser?.role}
            />
          </>
        )}


      </main>

      {userAttemptingLogin && (
        <UserLoginDialog
            isOpen={isUserLoginDialogOpen}
            onOpenChange={setIsUserLoginDialogOpen}
            userToLogin={userAttemptingLogin}
            onLoginSuccess={handleLoginSuccess}
        />
      )}

      {isAdminRole && (
        <>
          <AddProductDialog
            isOpen={isAddProductDialogOpen}
            onOpenChange={setIsAddProductDialogOpen}
            onAddProduct={handleAddProduct}
          />
          <SelectProductToEditDialog
            isOpen={isSelectProductToEditDialogOpen}
            onOpenChange={setIsSelectProductToEditDialogOpen}
            productTypes={productTypes}
            onProductSelected={handleProductSelectedForEdit}
            onProductSelectedForDelete={handleProductSelectedForDelete}
          />
          <ConfirmAdminPasswordDialog
            isOpen={isEditProductAdminAuthDialogOpen}
            onOpenChange={setIsEditProductAdminAuthDialogOpen}
            onAuthenticationSuccess={handleAdminAuthForEditProductSuccess}
            requiredPassword={REQUIRED_PASSWORD_FOR_ACTIONS}
            dialogTitle="Confirmar Edición de Tipo de Producto"
            dialogDescription="Ingresa la contraseña de administrador para editar este tipo de producto."
            confirmButtonText="Continuar con Edición"
          />
          <ConfirmAdminPasswordDialog
            isOpen={isDeleteProductAdminAuthDialogOpen}
            onOpenChange={setIsDeleteProductAdminAuthDialogOpen}
            onAuthenticationSuccess={handleAdminAuthForDeleteProductSuccess}
            requiredPassword={REQUIRED_PASSWORD_FOR_ACTIONS}
            dialogTitle="Confirmar Eliminación de Tipo de Producto"
            dialogDescription="Ingresa la contraseña de administrador para eliminar este tipo de producto."
            confirmButtonText="Confirmar Eliminación"
          />
          <ConfirmAdminPasswordDialog
            isOpen={isConfirmLostStatusAdminAuthDialogOpen}
            onOpenChange={setIsConfirmLostStatusAdminAuthDialogOpen}
            onAuthenticationSuccess={handleAdminAuthForLostStatusSuccess}
            requiredPassword={REQUIRED_PASSWORD_FOR_ACTIONS}
            dialogTitle="Confirmar Cambio a Estatus 'Perdido'"
            dialogDescription="Ingresa la contraseña de administrador para marcar los artículos seleccionados como 'Perdido'."
            confirmButtonText="Confirmar Cambio a Perdido"
          />
          <ReassignItemsBeforeDeleteDialog
            isOpen={isReassignItemsDialogOpen}
            onOpenChange={setIsReassignItemsDialogOpen}
            productToDelete={productTypeToDelete}
            itemCountToReassign={itemsToReassignDetails?.count || 0}
            availableProductTypes={otherProductTypesForReassignment}
            onConfirmReassignment={handleReassignItemsAndConfirmDeletion}
          />
          <EditProductTypeDialog
            isOpen={isEditProductTypeDialogOpen}
            onOpenChange={setIsEditProductTypeDialogOpen}
            onUpdateProductType={handleUpdateProductType}
            productToEdit={productToEdit}
          />
          <AddItemDialog
            isOpen={isAddItemDialogOpen}
            onOpenChange={setIsAddItemDialogOpen}
            onAddMultipleItems={handleAddMultipleItems}
            productTypes={productTypes}
            stores={stores}
            existingImeis={existingImeis}
          />
          <BulkChangeStatusDialog
            isOpen={isBulkChangeStatusDialogOpen}
            onOpenChange={setIsBulkChangeStatusDialogOpen}
            onConfirm={handleBulkChangeStatusAction}
            selectedItemCount={selectedItemImeis.length}
          />
          <BulkTransferDialog
            isOpen={isBulkTransferDialogOpen}
            onOpenChange={setIsBulkTransferDialogOpen}
            onConfirm={handleBulkTransferAction}
            selectedItemCount={selectedItemImeis.length}
            stores={stores}
          />
          <BulkSelectByImeiDialog 
            isOpen={isBulkSelectByImeiDialogOpen}
            onOpenChange={setIsBulkSelectByImeiDialogOpen}
            onImeisProcessed={handleImeisProcessedForBulkAction}
            allInventoryImeis={allInventoryImeisForSelection}
          />
          <DeleteItemConfirmationDialog
            isOpen={isDeleteItemConfirmationDialogOpen}
            onOpenChange={setIsDeleteItemConfirmationDialogOpen}
            onConfirm={handleConfirmDeleteItemsAction}
            selectedItemCount={selectedItemImeis.length}
            requiredPassword={REQUIRED_PASSWORD_FOR_ACTIONS}
          />
          <ActivityLogDialog
            isOpen={isActivityLogDialogOpen}
            onOpenChange={setIsActivityLogDialogOpen}
            logs={activityLogs}
            requiredPassword={REQUIRED_PASSWORD_FOR_ACTIONS}
          />
          <DatabaseManagementDialog
            isOpen={isDatabaseManagementDialogOpen}
            onOpenChange={setIsDatabaseManagementDialogOpen}
            onDownloadBackup={handleDownloadBackup}
            onUploadBackup={handleUploadBackup}
          />
          <InventoryReportsDialog 
            isOpen={isInventoryReportsDialogOpen}
            onOpenChange={setIsInventoryReportsDialogOpen}
            inventoryItems={inventoryItems}
            productTypes={productTypes}
            stores={stores}
          />
           <SelectedItemDetailsDialog
            isOpen={isSelectedItemDetailsDialogOpen}
            onOpenChange={setIsSelectedItemDetailsDialogOpen}
            itemsToShow={selectedItemsDetails}
            productTypes={productTypes}
            stores={stores}
          />
          <SoldItemsReportDialog
            isOpen={isSoldItemsReportDialogOpen}
            onOpenChange={setIsSoldItemsReportDialogOpen}
            inventoryItems={inventoryItems}
            productTypes={productTypes}
            stores={stores}
          />
          <CompareImeiListsDialog
            isOpen={isCompareImeiListsDialogOpen}
            onOpenChange={setIsCompareImeiListsDialogOpen}
          />
        </>
      )}
      <TransferReportsDialog
        isOpen={isTransferReportsDialogOpen}
        onOpenChange={setIsTransferReportsDialogOpen}
        logs={activityLogs}
        currentUser={currentUser}
        onConfirmReception={handleConfirmTransferReception}
        onCancelTransfer={handleCancelTransfer}
      />
      <footer className="text-center py-4 border-t text-sm text-muted-foreground">
        CellTrack &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}


    
