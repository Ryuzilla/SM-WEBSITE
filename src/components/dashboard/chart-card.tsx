"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportNodeToPng } from "@/lib/export";
import { toast } from "sonner";

export function ChartCard({
  title,
  description,
  actions,
  exportFileName,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** When provided, shows a "PNG" button that exports the chart body. */
  exportFileName?: string;
  children: React.ReactNode;
}) {
  const bodyRef = React.useRef<HTMLDivElement>(null);

  async function handleExport() {
    if (!bodyRef.current) return;
    try {
      await exportNodeToPng(bodyRef.current, exportFileName ?? "chart.png");
      toast.success("Chart exported as PNG");
    } catch {
      toast.error("Failed to export chart");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {exportFileName && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" /> PNG
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div ref={bodyRef} className="rounded-lg">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
