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

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Roles allowed to see this item. Omit = all roles. */
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Sales Trend", href: "/dashboard/sales-trend", icon: LineChart },
  { title: "Daily Sales", href: "/dashboard/daily-sales", icon: CalendarDays },
  { title: "Top Products", href: "/dashboard/products", icon: Package },
  { title: "Top Customers", href: "/dashboard/customers", icon: Users },
  { title: "Top Companies", href: "/dashboard/companies", icon: Building2 },
  {
    title: "Salesperson",
    href: "/dashboard/salespersons",
    icon: BarChart3,
  },
  {
    title: "Upload Data",
    href: "/dashboard/upload",
    icon: Upload,
    roles: ["admin"],
  },
  { title: "Reports", href: "/dashboard/reports", icon: FileText },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: UserCog,
    roles: ["admin"],
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
