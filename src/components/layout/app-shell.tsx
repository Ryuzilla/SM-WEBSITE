"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { UserProfile } from "@/lib/types";
import { NAV_ITEMS } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "./sidebar";
import { UserMenu } from "./user-menu";

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

/** Breadcrumb derived from the active route ("Dashboards / Overview"). */
function useCrumb() {
  const pathname = usePathname();
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) =>
      i.href === "/dashboard" ? pathname === i.href : pathname.startsWith(i.href),
    );
  return match?.title ?? "Overview";
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
  const crumb = useCrumb();

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-card/40 backdrop-blur-xl lg:block">
        <Sidebar profile={profile} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r bg-card shadow-2xl">
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Sidebar profile={profile} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 glass border-b">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Dashboards</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-semibold">{crumb}</span>
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
              <IconButton label="Refresh" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
              </IconButton>
              <IconButton
                label="Notifications"
                dot
                onClick={() => toast.info("ไม่มีการแจ้งเตือนใหม่")}
              >
                <Bell className="h-4 w-4" />
              </IconButton>
              <ThemeToggle />
              <UserMenu profile={profile} />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 p-4 lg:p-8">
          {children}
        </main>

        <footer className="border-t px-4 py-4 text-center text-xs text-muted-foreground lg:px-8">
          SM Analytics v1.0 · {demoMode ? "Demo data" : "Live data"}
        </footer>
      </div>
    </div>
  );
}
