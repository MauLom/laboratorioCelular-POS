

export interface ProductType {
  id: string;
  brand: string;
  model: string;
  minimumStock?: number; // Stock mínimo necesario
}

export interface Store {
  id: string;
  name: string;
}

export const ITEM_STATUSES = ["Nuevo", "Reparacion", "Reparado", "Vendido", "Liquidacion", "Perdido"] as const;
export type ItemStatus = typeof ITEM_STATUSES[number];

export interface InventoryItem {
  imei: string;
  imei2?: string;
  productTypeId: string;
  storeId: string;
  memory: string;
  color?: string; 
  supplier: string;
  purchasePrice: number;
  purchaseInvoiceId: string;
  purchaseInvoiceDate: string; // YYYY-MM-DD
  status: ItemStatus;
}

// --- Tipos para Usuarios ---
export type UserRole = 'admin' | 'consultas';

export interface User {
  id: string;
  name: string;
  passwordHash: string; 
  role: UserRole;
  storeId?: string; 
}
// --- Fin Tipos para Usuarios ---

// --- Tipos para el Log de Actividades ---
export type LogEntryAction =
  | "PRODUCT_TYPE_ADDED"
  | "PRODUCT_TYPE_UPDATED"
  | "PRODUCT_TYPE_DELETED" 
  | "ITEMS_REASSIGNED_PRODUCT_TYPE" 
  | "ITEM_ADDED"
  | "ITEMS_STATUS_CHANGED"
  | "ITEMS_TRANSFERRED"
  | "ITEMS_DELETED"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "TRANSFER_CONFIRMED"
  | "TRANSFER_CANCELLED";

export interface LogEntryDetails_ITEMS_TRANSFERRED {
  transferFolio: string; 
  imeis: string[];
  targetStoreId: string;
  targetStoreName?: string;
  count: number;
  originalStores: Record<string, string | undefined>;
  report: string;
  transferState: 'pending_admin_confirmation' | 'pending_consultas_confirmation' | 'completed' | 'cancelled';
  initiatorUserName?: string;
  
  adminConfirmedBy?: string;
  adminConfirmationTimestamp?: string; // ISO string
  consultasUserConfirmedBy?: string;
  consultasUserConfirmationTimestamp?: string; // ISO string
  targetStoreRequiresConsultasConfirmation?: boolean; 

  reportItemDetailsForConfirmation?: TransferReportItemDetail[]; 
  
  cancelledBy?: string; 
  cancellationTimestamp?: string; 
}

export interface LogEntryDetails_TRANSFER_CONFIRMED {
  originalTransferLogId: string;
  transferFolio?: string; 
  confirmedBy: string; 
  confirmationType: 'admin' | 'consultas' | 'master_admin'; // Added 'master_admin'
  targetStoreName?: string;
  itemCount: number;
  imeis: string[];
  role?: UserRole; 
}

export interface LogEntryDetails_TRANSFER_CANCELLED { 
  transferFolio: string;
  cancelledBy: string;
  originalTargetStoreName: string;
  itemCount: number;
  imeis: string[];
  reason?: string; 
}

export interface LogEntryDetails_PRODUCT_TYPE_DELETED {
  productId: string;
  brand: string;
  model: string;
  minimumStock?: number;
  reassignedItemsTo?: {
    newProductId: string;
    newProductBrandModel: string;
    itemCount: number;
  };
}

export interface LogEntryDetails_ITEMS_REASSIGNED {
  originalProductId: string;
  originalProductBrandModel: string;
  newProductId: string;
  newProductBrandModel: string;
  itemCount: number;
  imeis: string[];
}

export interface TransferReportItemDetail { 
  imei: string;
  productTypeName: string;
  originalStoreName: string;
  color?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string Date
  action: LogEntryAction;
  user?: string; 
  userRole?: UserRole; 
  details: Record<string, any> | LogEntryDetails_ITEMS_TRANSFERRED | LogEntryDetails_TRANSFER_CONFIRMED | LogEntryDetails_PRODUCT_TYPE_DELETED | LogEntryDetails_ITEMS_REASSIGNED | LogEntryDetails_TRANSFER_CANCELLED;
}
// --- Fin Tipos para el Log de Actividades ---



