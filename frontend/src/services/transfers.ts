const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");
const BASE = `${API_URL}/transfers`;

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
  const branchId = localStorage.getItem("branchId");

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    if (process.env.NODE_ENV === "development") {
    }
  } else {
  }

  if (branchId) {
    headers["x-branch-id"] = branchId;
    if (process.env.NODE_ENV === "development") {
    }
  } else {
  }

  return headers;
}

export async function createTransfer(payload: {
  equipmentIds: string[];
  toBranch: string;
  reason?: string;
  assignedDeliveryUser?: string | null;
}) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return res.json();
}

export async function getAllTransfers(params?: {
  imei?: string;
  fromBranch?: string;
  toBranch?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const query = new URLSearchParams();

    if (params) {
      if (params.imei) query.append("imei", params.imei);
      if (params.fromBranch) query.append("fromBranch", params.fromBranch);
      if (params.toBranch) query.append("toBranch", params.toBranch);
      if (params.date) query.append("date", params.date);
      if (params.startDate) query.append("startDate", params.startDate);
      if (params.endDate) query.append("endDate", params.endDate);
      if (params.page) query.append("page", String(params.page));
      if (params.limit) query.append("limit", String(params.limit));
    }

    const url = query.toString() ? `${BASE}?${query.toString()}` : BASE;

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn("⚠️ Backend transfers error:", errorText);
      throw new Error(errorText);
    }

    return res.json();
  } catch (err) {
    console.error("❌ Error en getAllTransfers:", err);
    return [];
  }
}

export async function getTransferById(id: string) {
  const res = await fetch(`${BASE}/${id}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return res.json();
}

export async function markCourierReceived(transferId: string, body: any) {
  const res = await fetch(`${BASE}/${transferId}/courier/items`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Error al actualizar estado de entrega");
  }

  return res.json();
}

export async function storeScan(
  id: string,
  actions: {
    imei: string;
    status: "received" | "not_received" | "pending";
    observation?: string;
  }[]
) {
  const res = await fetch(`${BASE}/${id}/store/items`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ actions }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return res.json();
}

export async function deleteTransfer(id: string) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return res.json();
}