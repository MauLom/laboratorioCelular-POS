export interface Brand {
  _id?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductType {
  _id?: string;
  company: string | Brand;
  model: string;
  minInventoryThreshold: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  _id?: string;
  imei: string;
  imei2?: string; // New
  state: 'New' | 'Repair' | 'OnRepair' | 'Repaired' | 'Sold' | 'OnSale' | 'Lost' | 'Clearance'; // Updated - keep old values for backward compatibility
  branch?: string; // Virtual field for backward compatibility
  franchiseLocation?: string | FranchiseLocation; // New field
  productType?: string | ProductType; // New
  hiddenDetails?: any;
  model?: string;
  brand?: string;
  color?: string;
  storage?: string;
  provider?: string; // New
  purchasePrice?: number; // New
  purchaseInvoiceId?: string; // New
  purchaseInvoiceDate?: string; // New
  price?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleArticle {
  id: string;
  description: string;
  concept: string;
  finance: string;
  imei?: string;
  reference?: string;
  amount: number;
  quantity: number;
}

export interface PaymentMethod {
  id: string;
  type: 'efectivo' | 'tarjeta' | 'dolar' | 'transferencia' | 'cheque';
  amount: number;
  reference?: string;
  notes?: string;
}

export interface Sale {
  _id?: string;
  folio?: number;
  description: 'Fair' | 'Payment' | 'Sale' | 'Deposit'; // Enum específico del backend
  finance: 'Payjoy' | 'Lespago' | 'Repair' | 'Accessory' | 'Cash' | 'Other';
  concept: 'Parciality' | 'Hitch' | 'Other';
  imei?: string;
  paymentType: string;
  reference: string;
  amount: number;
  paymentAmount?: number;
  paymentMethods?: PaymentMethod[]; // Múltiples métodos de pago
  articles?: SaleArticle[]; // Array de artículos para ventas multi-artículo
  customerName?: string;
  customerPhone?: string;
  branch?: string; // Virtual field for backward compatibility
  franchiseLocation?: string | FranchiseLocation; // New field
  notes?: string;
  // User information who created the sale
  createdBy?: string;
  createdByName?: string;
  createdByRole?: string;
  createdByUsername?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items?: T[];
  sales?: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}

// User Management Types
export type UserRole = 
  | 'Cajero'
  | 'Supervisor de sucursal'
  | 'Supervisor de sucursales'
  | 'Oficina'
  | 'Supervisor de oficina'
  | 'Master admin';

export interface FranchiseLocation {
  _id?: string;
  name: string;
  code: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contact: {
    phone?: string;
    email?: string;
  };
  type: 'Sucursal' | 'Oficina';
  isActive: boolean;
  notes?: string;
  guid?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: UserRole;
  franchiseLocation?: FranchiseLocation;
  isActive: boolean;
  lastLogin?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  canManageUsers: () => boolean;
}

export interface UserPaginatedResponse {
  users: User[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface LocationPaginatedResponse {
  locations: FranchiseLocation[];
  totalPages: number;
  currentPage: number;
  total: number;
}

// Configuration Types
export interface ConfigurationValue {
  value: string;
  label: string;
  isActive: boolean;
}

export interface Configuration {
  _id?: string;
  key: string;
  name: string;
  description?: string;
  values: ConfigurationValue[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Cash Session Types
export interface CashSession {
  _id?: string;
  franchiseLocation: string | FranchiseLocation;
  user: string | User;
  openDateTime: string;
  closeDateTime?: string | null;
  opening_cash_mxn: number;
  opening_cash_usd: number;
  closing_cash_mxn?: number | null;
  closing_cash_usd?: number | null;
  card_amount?: number;
  withdrawn_amount?: number;
  exchange_rate_usd_mxn: number;
  status: 'open' | 'closed';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CashSessionOpenRequest {
  franchiseLocationId: string;
  opening_cash_mxn: number;
  opening_cash_usd: number;
  exchange_rate_usd_mxn: number;
  notes?: string;
}

export interface CashSessionCloseRequest {
  franchiseLocationId: string;
  closing_cash_mxn: number;
  closing_cash_usd: number;
  card_amount?: number;
  withdrawn_amount?: number;
  notes?: string;
}

export interface CashSessionStatusResponse {
  hasSession: boolean;
  status?: 'open' | 'closed';
  message?: string;
  session?: CashSession;
}