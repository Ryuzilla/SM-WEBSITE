"use client";

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  /** Optional supporting line below the value. */
  hint?: string;
  /** Signed change for the trend pill (percentage). */
  change?: number | null;
  /** Accent color class for the icon chip. */
  accent?: string;
  /** 0-100 progress bar (e.g. target achievement). */
  progress?: number;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  hint,
  change,
  accent = "bg-primary/10 text-primary",
  progress,
}: KpiCardProps) {
  const showChange = change != null && Number.isFinite(change);
  const positive = (change ?? 0) >= 0;

  return (
    <Card className="group animate-fade-in overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-foreground/5",
              accent,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs">
          {showChange && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                positive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-500/15 text-red-600 dark:text-red-400",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(change!).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>

        {progress != null && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-chart-4 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
