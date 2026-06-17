"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AnalyticsBundle } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

/**
 * Generate an executive summary PDF report from the analytics bundle and
 * trigger a download. Covers KPIs, top products, customers, companies and
 * salesperson performance.
 */
export function generateExecutivePdf(data: AnalyticsBundle, filename: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString("en-GB");

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("Sales Analytics — Executive Summary", 40, 35);
  doc.setFontSize(10);
  doc.setTextColor(200, 210, 225);
  doc.text(`Generated ${now}`, 40, 54);

  doc.setTextColor(20, 20, 20);
  let y = 100;

  // KPI block
  const k = data.kpis;
  doc.setFontSize(13);
  doc.text("Key Performance Indicators", 40, y);
  y += 8;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", formatCurrency(k.totalRevenue)],
      ["Total Orders", formatNumber(k.totalOrders)],
      ["Unique Customers", formatNumber(k.uniqueCustomers)],
      ["Unique Companies", formatNumber(k.uniqueCompanies)],
      ["Average Order Value", formatCurrency(k.averageOrderValue)],
      ["Monthly Growth Rate", formatPercent(k.monthlyGrowthRate)],
      ["Avg Daily Revenue", formatCurrency(k.dailyRevenue)],
      ["Target Achievement", formatPercent(k.targetAchievement)],
    ],
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  // Top products
  doc.setFontSize(13);
  doc.text("Top 10 Products", 40, y);
  autoTable(doc, {
    startY: y + 8,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    head: [["#", "Product", "Revenue", "Qty", "Share"]],
    body: data.products.map((p, i) => [
      String(i + 1),
      p.productName,
      formatCurrency(p.revenue),
      formatNumber(p.quantity),
      `${p.revenueShare}%`,
    ]),
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  if (y > 650) {
    doc.addPage();
    y = 60;
  }

  // Top customers
  doc.setFontSize(13);
  doc.text("Top 10 Customers", 40, y);
  autoTable(doc, {
    startY: y + 8,
    theme: "striped",
    headStyles: { fillColor: [16, 185, 129] },
    head: [["#", "Customer", "Revenue", "Orders", "Last Purchase"]],
    body: data.customers.map((c, i) => [
      String(i + 1),
      c.customerName,
      formatCurrency(c.revenue),
      formatNumber(c.orders),
      c.lastPurchase,
    ]),
  });
  y = (doc as any).lastAutoTable.finalY + 24;

  if (y > 600) {
    doc.addPage();
    y = 60;
  }

  // Salesperson performance
  doc.setFontSize(13);
  doc.text("Salesperson Performance", 40, y);
  autoTable(doc, {
    startY: y + 8,
    theme: "striped",
    headStyles: { fillColor: [139, 92, 246] },
    head: [["#", "Salesperson", "Revenue", "Target %", "Customers", "Score"]],
    body: data.salespersons.map((s, i) => [
      String(i + 1),
      s.name + (s.isTopPerformer ? "  ★" : ""),
      formatCurrency(s.totalRevenue),
      formatPercent(s.targetAchievement),
      formatNumber(s.customersManaged),
      String(s.performanceScore),
    ]),
  });

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Page ${i} of ${pageCount}  ·  SM Sales Analytics`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 20,
      { align: "center" },
    );
  }

  doc.save(filename);
}
