"use client";

import { useAuth } from "@/lib/mysql/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useCommonTranslations, useAuthTranslations } from "@/components/LocaleProvider";

// استيراد لوحات التحكم
// تأكد أن هذه الملفات موجودة وأنها تصدر المكونات بشكل صحيح
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { EngineerDashboard } from "@/components/dashboards/engineer-dashboard";
import { SupervisorDashboard } from "@/components/dashboards/supervisor-dashboard"; 

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const tCommon = useCommonTranslations();
  const tAuthReset = useAuthTranslations("resetPassword");

  // التوجيه إذا لم يكن مسجلاً
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (!isLoading && user?.isPlatformAdmin) {
      router.push("/platform");
    }
  }, [user, isLoading, router]);

  // شاشة التحميل
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-gray-500">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن هناك مستخدم بعد التحميل، لا تعرض شيئاً (سيتم التوجيه)
  if (!user) return null;
  if (user.isPlatformAdmin) return null;

  // توجيه حسب الدور
  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    
    case "structural_engineer":
    case "engineer":
      return <EngineerDashboard />;
      
    case "site_manager":
    case "manager":
    case "supervisor":
      return <SupervisorDashboard />;
      
    default:
      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md border border-red-100 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl font-bold text-red-600">!</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{tCommon("unknownRole")}</h2>
            <p className="text-gray-600 mb-4">
              {tCommon("unknownRoleDescription").replace("{role}", String(user.role))}
            </p>
            <button 
              onClick={() => router.push('/login')}
              className="text-sm text-blue-600 hover:underline"
            >
              {tAuthReset("backToLogin")}
            </button>
          </div>
        </div>
      );
  }
}
