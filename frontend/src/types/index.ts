export interface InventoryItem {
  _id?: string;
  imei: string;
  state: 'New' | 'Repair' | 'Repaired' | 'Sold' | 'Lost' | 'Clearance';
  branch: string;
  hiddenDetails?: any;
  model?: string;
  brand?: string;
  price?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sale {
  _id?: string;
  description: 'Fair' | 'Payment' | 'Sale' | 'Deposit';
  finance: 'Payjoy' | 'Lespago' | 'Repair' | 'Accessory' | 'Cash' | 'Other';
  concept: string;
  imei?: string;
  paymentType: string;
  reference: string;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  branch?: string;
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