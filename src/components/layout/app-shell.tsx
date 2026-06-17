"use client";

import * as React from "react";
import { BarChart3, Menu, X } from "lucide-react";
import { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

function Brand() {
  return (
    <div className="flex items-center gap-2 px-6 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BarChart3 className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">SM Analytics</p>
        <p className="text-xs text-muted-foreground">Executive Suite</p>
      </div>
    </div>
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
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-card lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          <SidebarNav role={profile.role} />
        </div>
        <div className="border-t p-4 text-xs text-muted-foreground">
          v1.0 · {demoMode ? "Demo data" : "Live data"}
        </div>
      </aside>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card shadow-xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <SidebarNav
                role={profile.role}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          {demoMode && (
            <Badge variant="warning" className="hidden sm:flex">
              Demo Mode
            </Badge>
          )}
          <ThemeToggle />
          <UserMenu profile={profile} />
        </header>

        <main className={cn("flex-1 space-y-6 p-4 lg:p-8")}>{children}</main>
      </div>
    </div>
  );
}
