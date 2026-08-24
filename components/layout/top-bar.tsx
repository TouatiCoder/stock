"use client";

import { Bell, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCommonTranslations, useLocale } from "@/components/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
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

type NotificationItem = {
  id: string;
  type_code: string;
  title: string;
  body_text: string | null;
  is_read: number;
  created_at: string;
};

export function TopBar({ user }: TopBarProps) {
  const t = useCommonTranslations();
  const { dir } = useLocale();
  const [items, setItems] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => Number(n.is_read) === 0).length, [items]);

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST", credentials: "include" });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" });
      setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

  const getUserInitial = () => {
    if (!user) return "U";
    const firstLetter = user.firstName?.charAt(0) || user.email?.charAt(0) || "U";
    return firstLetter.toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 flex-1 max-w-xs">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder={t("search")}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label={t("info")}>
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 max-h-[420px] overflow-auto">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>{t("notifications")}</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                  {t("markAllRead")}
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {items.length === 0 ? (
              <div className="px-2 py-4 text-sm text-gray-500">{t("noNotifications")}</div>
            ) : (
              items.map((n) => (
                <DropdownMenuItem key={n.id} onClick={() => markRead(n.id)} className="items-start gap-3 py-2">
                  <div className={`mt-1 h-2 w-2 rounded-full ${Number(n.is_read) === 0 ? "bg-red-500" : "bg-gray-300"}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-5">{n.title}</p>
                    {n.body_text && <p className="text-xs text-gray-500 mt-1">{n.body_text}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-3">
          <LanguageSwitcher className={dir === "rtl" ? "ml-2" : "mr-2"} />
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">{getUserInitial()}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{user?.firstName || t("user")}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ") || t("user")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
