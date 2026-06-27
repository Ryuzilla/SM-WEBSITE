"use client";

import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";

export function HighlightCard({
  eyebrow,
  value,
  title,
  description,
  ctaLabel,
  href,
}: {
  eyebrow: string;
  value: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-6">
      {/* Lime glow spot */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Zap className="h-3 w-3" />
          {eyebrow}
        </div>

        <div className="mt-4">
          <p className="font-display text-4xl font-bold tracking-tight">{value}</p>
        </div>
        <p className="mt-1 text-base font-semibold">{title}</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>

        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 glow-primary"
        >
          {ctaLabel}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
