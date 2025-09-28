"use client";

import { Badge } from "@/components/ui/badge";
import type { ItemStatus } from "@/types/inventory";

interface InventoryStatusBadgeProps {
  status: ItemStatus;
  className?: string;
}

export function InventoryStatusBadge({ status, className }: InventoryStatusBadgeProps) {
  const getStatusVariant = (status: ItemStatus) => {
    switch (status) {
      case "Nuevo":
        return "success" as const;
      case "Reparacion":
        return "warning" as const;
      case "Reparado":
        return "secondary" as const;
      case "Vendido":
        return "default" as const;
      case "Liquidacion":
        return "outline" as const;
      case "Perdido":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getStatusEmoji = (status: ItemStatus) => {
    switch (status) {
      case "Nuevo":
        return "✨";
      case "Reparacion":
        return "🔧";
      case "Reparado":
        return "✅";
      case "Vendido":
        return "💰";
      case "Liquidacion":
        return "🏷️";
      case "Perdido":
        return "❌";
      default:
        return "❓";
    }
  };

  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      <span className="mr-1">{getStatusEmoji(status)}</span>
      {status}
    </Badge>
  );
}