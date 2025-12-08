import React from "react";
import { Badge } from "@/components/ui/badge";

// [CHANGE] Extended to include "ForwardedToAdmin" for adviser advisory section submissions
export type StatusType = "Draft" | "Returned" | "ForAdviser" | "ForwardedToAdmin";

interface StatusBadgeProps {
  status: StatusType;
}

// [CHANGE] Added mapping for "ForwardedToAdmin" with appropriate color and label
const statusMap: Record<StatusType, { color: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  Draft: { color: "default", label: "Draft" },
  Returned: { color: "secondary", label: "Returned – Needs Revision" },
  ForAdviser: { color: "destructive", label: "Pending Adviser Review" },
  ForwardedToAdmin: { color: "secondary", label: "Forwarded to Admin" }, // [CHANGE] New status for advisers
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusInfo = statusMap[status];

  return (
    <Badge variant={statusInfo.color}>
      {statusInfo.label}
    </Badge>
  );
}
