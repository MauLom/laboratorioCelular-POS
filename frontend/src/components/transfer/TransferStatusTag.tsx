import React from "react";

interface Props {
  status: string;
}

const colors: Record<string, string> = {
  pendiente: "#facc15",
  en_transito: "#3b82f6",
  en_transito_completa: "#2563eb",
  recibida: "#22c55e",
  completa: "#22c55e",
  no_recibido: "#ef4444",
  fallida: "#ef4444",
};

function formatStatus(raw: string) {
  if (!raw) return "";

  let clean = raw.toLowerCase().replace(/_/g, " ");

  clean = clean.replace("transito", "tránsito");

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

const TransferStatusTag: React.FC<Props> = ({ status }) => {
  const key = status.toLowerCase();
  const color = colors[key] || "#9ca3af";

  return (
    <span
      style={{
        backgroundColor: color,
        color: "#fff",
        padding: "4px 10px",
        borderRadius: "6px",
        fontSize: "0.82rem",
        fontWeight: 600,
        letterSpacing: "0.3px",
        display: "inline-block",
      }}
    >
      {formatStatus(status)}
    </span>
  );
};

export default TransferStatusTag;