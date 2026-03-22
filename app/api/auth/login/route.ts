import { NextResponse } from "next/server";
import { AuthService } from "@/lib/mysql/auth-service";
import { createNotification } from "@/lib/backlog/notifications";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const result = await AuthService.login(email, password);
    if (!result) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }
    if (result.user.authMethod === "biometric_only") {
      return NextResponse.json(
        { error: "Password login is disabled for this account. Use biometric login.", code: "BIOMETRIC_REQUIRED" },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      previousLoginAt: result.meta.previousLoginAt,
      subscriptionStatus: result.meta.subscriptionStatus,
      subscriptionTrialEndsAt: result.meta.subscriptionTrialEndsAt,
    });

    try {
      if (result.meta.previousLoginAt) {
        await createNotification({
          companyId: result.user.companyId,
          userId: result.user.id,
          typeCode: "login_last_seen",
          title: "Derniere connexion",
          bodyText: `Votre derniere connexion etait le ${new Date(result.meta.previousLoginAt).toLocaleString()}`,
        });
      } else {
        await createNotification({
          companyId: result.user.companyId,
          userId: result.user.id,
          typeCode: "login_first",
          title: "Bienvenue",
          bodyText: "Ceci est votre premiere connexion a la plateforme.",
        });
      }

      if (result.meta.subscriptionStatus === "trialing") {
        const endsAt = result.meta.subscriptionTrialEndsAt ? new Date(result.meta.subscriptionTrialEndsAt).toLocaleDateString() : null;
        await createNotification({
          companyId: result.user.companyId,
          userId: result.user.id,
          typeCode: "trial_active",
          title: "Periode d'essai active",
          bodyText: endsAt
            ? `Votre essai est actif jusqu'au ${endsAt}. Pensez a vous abonner.`
            : "Votre compte est en periode d'essai. Pensez a vous abonner.",
        });
      }
    } catch (notificationError) {
      console.error("Login notification error:", notificationError);
    }

    response.cookies.set("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
