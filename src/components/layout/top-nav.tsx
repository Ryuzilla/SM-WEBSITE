"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemsForRole } from "@/lib/navigation";
import { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Horizontal pill navigation used in the top bar. The active route is a filled
 * primary pill; the rest are quiet until hovered. Scrolls horizontally when the
 * full set of links exceeds the available width.
 */
export function TopNav({
  role,
  onNavigate,
  className,
}: {
  role: UserRole;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <nav
      className={cn(
        "flex items-center gap-1 rounded-full border bg-secondary/40 p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.6)]"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
