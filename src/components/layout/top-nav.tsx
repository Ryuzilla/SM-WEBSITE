"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { navItemsForRole } from "@/lib/navigation";
import { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// How many links to show as pills before collapsing the rest into "More".
const PRIMARY_COUNT = 5;

/**
 * Compact top navigation: the first few destinations are pills; everything else
 * folds into a "More" dropdown so the bar stays uncluttered even with many
 * sections. The active route always reads as selected — even from inside More.
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

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const primary = items.slice(0, PRIMARY_COUNT);
  const overflow = items.slice(PRIMARY_COUNT);
  const overflowActive = overflow.some((i) => isActive(i.href));

  return (
    <nav
      className={cn(
        "flex items-center gap-1 rounded-full border bg-secondary/40 p-1",
        className,
      )}
    >
      {primary.map((item) => {
        const active = isActive(item.href);
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

      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all",
                overflowActive
                  ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.6)]"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
              More
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            {overflow.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2",
                      active && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
