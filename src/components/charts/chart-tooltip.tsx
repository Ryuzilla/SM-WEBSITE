"use client";

import { formatCurrency, formatNumber } from "@/lib/utils";

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

/**
 * Shared Recharts tooltip with the dashboard's card styling. Values whose
 * dataKey looks monetary are currency-formatted; others use plain numbers.
 */
export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const isMoney = (key: string) =>
    /revenue|amount|target|forecast|sales/i.test(key);

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      {label && <p className="mb-1 font-medium">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {isMoney(entry.dataKey)
                ? formatCurrency(entry.value, { compact: true })
                : formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
