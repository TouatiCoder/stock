"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, Eye, Key } from "lucide-react";
import { toast } from "sonner";

import { LoginForm } from "@/components/auth/login-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { useAuthTranslations, useCommonTranslations } from "@/components/LocaleProvider";

type BiometricPhase = "idle" | "attempting" | "failed" | "unavailable";

export default function LoginPage() {
  const router = useRouter();
  const t = useAuthTranslations("login");
  const tCommon = useCommonTranslations();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricPhase, setBiometricPhase] = useState<BiometricPhase>("idle");

  useEffect(() => {
    let canceled = false;

    const tryBiometricAutoLogin = async () => {
      if (
        typeof window === "undefined" ||
        !window.PublicKeyCredential ||
        !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
      ) {
        if (!canceled) setBiometricPhase("unavailable");
        return;
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
      if (!available) {
        if (!canceled) {
          setBiometricAvailable(false);
          setBiometricPhase("unavailable");
        }
        return;
      }

      if (canceled) return;

      setBiometricAvailable(true);
      setBiometricPhase("attempting");

      try {
        const optionsRes = await fetch("/api/webauthn/login/options", { method: "POST" });
        const optionsData = await optionsRes.json();
        if (!optionsRes.ok) throw new Error(optionsData.error || "Failed to start biometric login");

        const assertionResponse = await startAuthentication(optionsData.options);

        const verifyRes = await fetch("/api/webauthn/login/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId: optionsData.challengeId, response: assertionResponse }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.error || "Biometric login failed");

        window.location.href = "/dashboard";
      } catch (error: any) {
        if (!canceled) {
          console.error("Auto biometric authentication error:", error);
          setBiometricPhase("failed");
          toast.info("Biometric login unavailable or canceled. You can sign in with password.");
        }
      }
    };

    tryBiometricAutoLogin();

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <span className="text-white font-bold text-3xl">{tCommon("appShortName")}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{t("title")}</h1>
          <p className="text-gray-500">{t("subtitle")}</p>
        </div>

        {biometricAvailable && biometricPhase === "attempting" && (
          <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
            <Fingerprint className="h-5 w-5 text-blue-700" />
            <div className="text-sm text-blue-800">
              <p>Attempting biometric sign-in. If Face ID is available, Windows Hello should open the camera automatically.</p>
              <p className="mt-1 font-medium">Please select Windows Hello to continue.</p>
            </div>
          </div>
        )}

        {biometricAvailable && biometricPhase !== "attempting" && (
          <div className="mb-6">
            <Button
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Fingerprint className="mr-2 h-5 w-5" />
              Try Biometric Again
            </Button>
          </div>
        )}

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-50 text-gray-400 font-medium">{t("orContinue")}</span>
          </div>
        </div>

        <div className="mb-6 bg-white p-1 rounded-xl">
          <LoginForm />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/forgot-password")}
              className="flex items-center justify-center gap-2 h-11 border-gray-200 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              <Key size={16} />
              <span className="text-xs font-medium">{t("forgotLink")}</span>
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              {t("noAccount")} {" "}
              <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all">
                {t("createAdmin")}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900 mb-1">{tCommon("security")}</h3>
            <p className="text-xs text-blue-700/80 leading-relaxed">{t("subtitle")}</p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
