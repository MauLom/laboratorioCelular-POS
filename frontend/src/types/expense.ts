export interface Expense {
  _id?: string;
  reason: string;
  amount: number;
  user: string;
  date: string;
  notes?: string;
  franchiseLocation: string;
  deviceGuid?: string;
}
export interface ExpenseListResponse {
  ok: boolean;
  data: Expense[];
  total: number;
}