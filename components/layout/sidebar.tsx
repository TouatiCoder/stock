"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useState } from "react";
import { hasPermission, type Permission, type UserRole } from "@/lib/permissions";
import { useAuth } from "@/lib/mysql/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { STATIC_NAV_PAGES } from "./nav-pages";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";

interface SidebarProps {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string;
    phone?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const isMobile = useIsMobile();
  const { dir } = useLocale();
  const t = useCommonTranslations();
  const isCompact = isMobile ? !isMobileExpanded : isCollapsed;

  const checkPermission = (permission: Permission): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role as UserRole, permission);
  };

  const handleLogout = async () => {
    try {
      document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  const menuItems = STATIC_NAV_PAGES.map((page) => ({
    ...page,
    label: t(page.labelKey),
  }));

  const getUserFullName = () => {
    if (!user) return t("user");
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  };

  const getRoleDisplay = () => {
    if (!user?.role) return t("user");
    switch (user.role) {
      case "admin":
        return t("admin");
      case "site_manager":
        return t("siteManager");
      case "structural_engineer":
        return t("engineer");
      default:
        return String(user.role).replace("_", " ");
    }
  };

  const getUserInitials = () => {
    if (!user) return t("userInitial");
    const first = user.firstName?.charAt(0) || "";
    const last = user.lastName?.charAt(0) || "";

    if (first && last) return `${first}${last}`.toUpperCase();
    if (first) return first.toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return t("userInitial");
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileExpanded((prev) => !prev);
      return;
    }
    setIsCollapsed((prev) => !prev);
  };

  const ToggleIcon = dir === "rtl"
    ? (isCompact ? ChevronLeft : ChevronRight)
    : (isCompact ? ChevronRight : ChevronLeft);

  return (
    <aside className={`flex bg-white border-r border-gray-200 transition-all duration-300 ${isCompact ? "w-20" : "w-64"} flex-col h-screen sticky top-0`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${isCompact ? "justify-center w-full" : ""}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            {isCompact ? <span className="text-white font-bold text-sm">{t("appShortName")}</span> : <Building className="h-5 w-5 text-white" />}
            </div>
          {!isCompact && (
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 truncate">{t("appName")}</h1>
              <p className="text-xs text-gray-500 truncate">{t("dashboard")}</p>
            </div>
          )}
        </div>
        <button onClick={toggleSidebar} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500" aria-label={t("sidebarToggle")}>
          <ToggleIcon className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          if (!checkPermission(item.permission)) return null;
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isCompact ? "justify-center" : ""} ${
                item.indent && !isCompact ? "pl-6" : ""
              } ${
                isActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              }`}
              title={isCompact ? item.label : ""}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCompact && <span className="text-sm font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        {!isCompact && user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{getUserInitials()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{getUserFullName()}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{getRoleDisplay()}</p>
              </div>
            </div>
          </div>
        ) : isCompact && user ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{getUserInitials()}</span>
            </div>
          </div>
        ) : null}

        <button onClick={handleLogout} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors ${isCompact ? "justify-center" : ""}`} title={isCompact ? t("logout") : ""}>
          <LogOut size={18} className="flex-shrink-0" />
          {!isCompact && <span className="text-sm font-medium">{t("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
