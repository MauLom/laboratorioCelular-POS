import type { Expense } from '../types/expense';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const BASE = `${API_URL}/expenses`;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    if (process.env.NODE_ENV === 'development') {
      console.log("Enviando token:", token.slice(0, 25) + "...");
    }
  } else {
    console.warn("No se encontró token en localStorage");
  }

  return headers;
}

// Listar gastos
export async function listExpenses(params?: { from?: string; to?: string; user?: string; q?: string; }): Promise<Expense[]> {
  try {
    const url = new URL(BASE);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) url.searchParams.set(k, v);
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("Solicitando gastos desde:", url.toString());
    }

    const res = await fetch(url.toString(), { headers: getAuthHeaders() });

    if (!res.ok) throw new Error('Error al cargar gastos');
    const data = await res.json();

    return Array.isArray(data) ? data : data.data || [];
  } catch (err) {
    console.error("Error en listExpenses:", err);
    throw err;
  }
}

// Crear gasto
export async function createExpense(payload: Expense): Promise<Expense> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Expense>;
}

// Actualizar gasto
export async function updateExpense(id: string, payload: Expense): Promise<Expense> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Expense>;
}

// Eliminar gasto
export async function deleteExpense(id: string) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}