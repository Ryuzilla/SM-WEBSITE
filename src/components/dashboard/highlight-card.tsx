"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

/**
 * Vibrant gradient call-to-action panel — the showpiece "premium" card from the
 * reference dashboards. Big stat, supporting copy, and a contrasting action.
 */
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-[0_20px_50px_-20px_rgb(79_70_229/0.8)]">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </div>

        <div className="mt-4 flex items-end gap-2">
          <p className="text-4xl font-bold tracking-tight">{value}</p>
        </div>
        <p className="mt-1 text-lg font-semibold">{title}</p>
        <p className="mt-1 max-w-xs text-sm text-white/80">{description}</p>

        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition-transform hover:scale-[1.03]"
        >
          {ctaLabel}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
