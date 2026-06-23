"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, TrendingUp } from "lucide-react";
import { NAV_GROUPS, navItemsForRole } from "@/lib/navigation";
import { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name?: string | null) {
  if (!name) return "SM";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Persistent left navigation rail (reference-2 layout). Brand + user identity
 * up top, grouped destinations below, with the active route shown as a filled
 * primary pill. Rendered both in the fixed desktop column and the mobile drawer.
 */
export function Sidebar({
  profile,
  onNavigate,
}: {
  profile: UserProfile;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = navItemsForRole(profile.role);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      {/* Brand + user identity */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-3 text-primary-foreground shadow-[0_8px_22px_-8px_hsl(var(--primary)/0.8)]">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold tracking-tight">
            {profile.full_name ?? "SM Analytics"}
          </p>
          <p className="truncate text-[11px] capitalize text-muted-foreground">
            {profile.role}
          </p>
        </div>
      </div>

      {/* Search (visual entry point) */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          readOnly
          placeholder="Search…"
          aria-label="Search"
          className="h-10 w-full rounded-xl border bg-secondary/40 pl-9 pr-3 text-sm text-muted-foreground outline-none transition-colors focus:border-primary/50"
        />
      </div>

      {/* Grouped navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const groupItems = items.filter((i) => i.group === group.id);
          if (groupItems.length === 0) return null;
          return (
            <div key={group.id} className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              {groupItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.7)]"
                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0",
                        active
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer identity chip */}
      <div className="flex items-center gap-3 rounded-xl border bg-secondary/30 px-3 py-2.5">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
            {initials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-medium">{profile.full_name ?? "User"}</p>
          <p className="truncate text-[11px] text-muted-foreground">{profile.email}</p>
        </div>
      </div>
    </div>
  );
}
