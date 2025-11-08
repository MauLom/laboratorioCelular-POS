export interface Expense {
  _id?: string;
  reason: string;
  amount: number;
  user: string;
  date: string; // formato ISO
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseListResponse {
  ok: boolean;
  data: Expense[];
  total: number;
}