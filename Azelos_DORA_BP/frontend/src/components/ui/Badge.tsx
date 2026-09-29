import type { ReactNode } from "react";

export type BadgeTone = "critical" | "high" | "medium" | "low" | "success" | "neutral";

const toneClass: Record<BadgeTone, string> = {
  critical: "bg-critical-bg text-critical-text",
  high: "bg-high-bg text-high-text",
  medium: "bg-medium-bg text-medium-text",
  low: "bg-low-bg text-low-text",
  success: "bg-success-bg text-success-text",
  neutral: "bg-gray-100 text-gray-700",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Map backend criticality / risk level strings to badge tone (display only). */
export function toneFromLevel(value: string | undefined): BadgeTone {
  const v = (value ?? "").toLowerCase();
  if (v.includes("critical")) return "critical";
  if (v === "high" || v.includes("important")) return "high";
  if (v === "medium") return "medium";
  if (v === "low" || v === "neither") return "low";
  if (v.includes("implement") || v === "open" || v === "active") return "success";
  return "neutral";
}
