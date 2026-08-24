"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthTranslations } from "@/components/LocaleProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useAuthTranslations("invite");
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const inviteToken = searchParams.get("token") || "";
    setToken(inviteToken);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(t("invalidLink"));
      return;
    }

    if (password.length < 6) {
      toast.error(t("passwordMinLength"));
      return;
    }

    if (password !== confirm) {
      toast.error(t("passwordMismatch"));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("acceptError"));

      toast.success(t("acceptSuccess"));
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.message || t("acceptError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <div className="p-6">
          <h1 className="text-xl font-bold mb-2">{t("acceptTitle")}</h1>
          <p className="text-sm text-gray-600 mb-6">{t("acceptSubtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-700">{t("password")}</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1 h-8 w-8"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">{t("confirmPassword")}</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="********"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-1 top-1 h-8 w-8"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? t("submitting") : t("activateAccount")}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
