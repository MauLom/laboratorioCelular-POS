import React from "react";

interface Props {
  status: string;
}

const colors: Record<string, string> = {
  pending: "#facc15",
  in_transit_partial: "#3b82f6",
  in_transit_complete: "#2563eb",
  completed: "#22c55e",
  incomplete: "#f97316",
  failed: "#ef4444",
};

const statusTranslation: Record<string, string> = {
  pending: "Pendiente",
  in_transit_partial: "En tránsito parcial",
  in_transit_complete: "En tránsito completo",
  completed: "Completada",
  incomplete: "Incompleta",
  failed: "Fallida",
};

function formatStatus(raw: string) {
  if (!raw) return "";

  const key = raw.toLowerCase();
  return statusTranslation[key] || raw;
}

const TransferStatusTag: React.FC<Props> = ({ status }) => {
  const key = status?.toLowerCase() || "";
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