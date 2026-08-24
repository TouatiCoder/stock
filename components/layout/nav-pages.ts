import {
  LayoutDashboard,
  Package,
  Calculator,
  DollarSign,
  Settings,
  BarChart3,
  Warehouse,
  Users,
  Fingerprint,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export type NavPage = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
  indent?: boolean;
  quickAccess?: boolean;
  quickAccessColor?: string;
};

export const STATIC_NAV_PAGES: NavPage[] = [
  { href: "/dashboard", icon: LayoutDashboard, permission: "view_dashboard", labelKey: "dashboard" },
  { href: "/inventory", icon: Package, permission: "view_inventory", labelKey: "inventory", quickAccess: true, quickAccessColor: "text-orange-600" },
  { href: "/warehouses", icon: Warehouse, permission: "view_inventory", labelKey: "warehouses" },
  { href: "/projects", icon: Calculator, permission: "view_projects", labelKey: "projects", quickAccess: true, quickAccessColor: "text-blue-600" },
  { href: "/costs", icon: DollarSign, permission: "view_costs", labelKey: "costs", quickAccess: true, quickAccessColor: "text-green-600" },
  { href: "/reports", icon: BarChart3, permission: "view_reports", labelKey: "reports", quickAccess: true, quickAccessColor: "text-red-600" },
  { href: "/settings", icon: Settings, permission: "view_settings", labelKey: "settings" },
  { href: "/settings?tab=users", icon: Users, permission: "manage_users", labelKey: "admin", indent: true, quickAccess: true, quickAccessColor: "text-indigo-600" },
  { href: "/settings/biometric", icon: Fingerprint, permission: "view_settings", labelKey: "security", indent: true },
];
