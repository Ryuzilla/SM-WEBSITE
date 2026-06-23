import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LineChart,
  Package,
  Upload,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "./types";

export type NavGroup = "main" | "workspace";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item. Omit = all roles. */
  roles?: UserRole[];
  /** Sidebar section this item belongs to. */
  group?: NavGroup;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard, group: "main" },
  { title: "Sales Trend", href: "/dashboard/sales-trend", icon: LineChart, group: "main" },
  { title: "Daily Sales", href: "/dashboard/daily-sales", icon: CalendarDays, group: "main" },
  { title: "Top Products", href: "/dashboard/products", icon: Package, group: "main" },
  { title: "Top Customers", href: "/dashboard/customers", icon: Users, group: "main" },
  { title: "Top Companies", href: "/dashboard/companies", icon: Building2, group: "main" },
  {
    title: "Salesperson",
    href: "/dashboard/salespersons",
    icon: BarChart3,
    group: "main",
  },
  {
    title: "Upload Data",
    href: "/dashboard/upload",
    icon: Upload,
    roles: ["admin"],
    group: "workspace",
  },
  { title: "Reports", href: "/dashboard/reports", icon: FileText, group: "workspace" },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: UserCog,
    roles: ["admin"],
    group: "workspace",
  },
];

export const NAV_GROUPS: { id: NavGroup; label: string }[] = [
  { id: "main", label: "Dashboards" },
  { id: "workspace", label: "Workspace" },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
