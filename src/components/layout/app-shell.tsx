"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Menu, Search, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopNav } from "./top-nav";
import { UserMenu } from "./user-menu";

function Brand() {
  return (
    <Link aria-label="SM Analytics home" href="/dashboard" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-4 text-primary-foreground shadow-[0_6px_18px_-6px_hsl(var(--primary)/0.7)]">
        <TrendingUp className="h-5 w-5" />
      </div>
      <div className="hidden leading-tight sm:block">
        <p className="text-sm font-semibold tracking-tight">SM Analytics</p>
        <p className="text-[11px] text-muted-foreground">Executive Suite</p>
      </div>
    </Link>
  );
}

function IconButton({
  label,
  onClick,
  children,
  dot,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border bg-secondary/40 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      {children}
      {dot && (
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
      )}
    </button>
  );
}

export function AppShell({
  profile,
  demoMode,
  children,
}: {
  profile: UserProfile;
  demoMode: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 glass border-b">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
          <Brand />

          {/* Desktop pill nav */}
          <div className="hidden flex-1 justify-center overflow-x-auto px-2 scrollbar-thin lg:flex">
            <TopNav role={profile.role} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {demoMode && (
              <Badge variant="warning" className="hidden md:flex">
                Demo Mode
              </Badge>
            )}
            <IconButton
              label="Search"
              onClick={() => toast.info("ใช้ตัวกรองด้านบนของแต่ละหน้าเพื่อค้นหาข้อมูล")}
            >
              <Search className="h-4 w-4" />
            </IconButton>
            <IconButton label="Notifications" dot onClick={() => toast.info("ไม่มีการแจ้งเตือนใหม่")}>
              <Bell className="h-4 w-4" />
            </IconButton>
            <ThemeToggle />
            <UserMenu profile={profile} />

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="border-t px-4 py-3 lg:hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <TopNav role={profile.role} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-4 lg:p-8">
        {children}
      </main>

      <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground lg:px-8">
        SM Analytics v1.0 · {demoMode ? "Demo data" : "Live data"}
      </footer>
    </div>
  );
}
