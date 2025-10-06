export interface InventoryItem {
  _id?: string;
  imei: string;
  state: 'New' | 'Repair' | 'Repaired' | 'Sold' | 'Lost' | 'Clearance';
  branch?: string; // Virtual field for backward compatibility
  franchiseLocation?: string | FranchiseLocation; // New field
  hiddenDetails?: any;
  model?: string;
  brand?: string;
  color?: string;
  storage?: string;
  price?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sale {
  _id?: string;
  folio?: number;
  description: 'Fair' | 'Payment' | 'Sale' | 'Deposit';
  finance: 'Payjoy' | 'Lespago' | 'Repair' | 'Accessory' | 'Cash' | 'Other';
  concept: string;
  imei?: string;
  paymentType: string;
  reference: string;
  amount: number;
  paymentAmount?: number;
  customerName?: string;
  customerPhone?: string;
  branch?: string; // Virtual field for backward compatibility
  franchiseLocation?: string | FranchiseLocation; // New field
  notes?: string;
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