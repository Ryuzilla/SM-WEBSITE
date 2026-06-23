"use client";

/**
 * Semicircular progress gauge for goal-style KPIs (e.g. "Quarterly revenue
 * goal" in reference-2). Pure SVG so it scales crisply and animates cheaply.
 */
export function RadialGauge({
  value,
  size = 132,
  label,
}: {
  value: number; // 0-100
  size?: number;
  label?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // Semicircle: half the circumference is the full track.
  const circumference = Math.PI * r;
  const dash = (pct / 100) * circumference;

  return (
    <div
      className="relative"
      style={{ width: size, height: size / 2 + 8 }}
      role="img"
      aria-label={`${label ?? "Progress"}: ${pct.toFixed(0)}%`}
    >
      <svg width={size} height={size / 2 + 8} className="overflow-visible">
        <defs>
          <linearGradient id="gaugeFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--chart-1))" />
            <stop offset="100%" stopColor="hsl(var(--chart-3))" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none"
          stroke="url(#gaugeFill)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="text-xl font-bold tracking-tight">{pct.toFixed(0)}%</span>
        {label && <span className="text-[11px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
