import { paymentProvidersService } from "@/lib/payment-providers/service";

export class PayPalClientService {
  async testConnection() {
    const cfg = await paymentProvidersService.getPayPalRuntimeConfig();
    const fallbackMode = (process.env.PAYPAL_MODE || "test") === "live" ? "live" : "test";

    const mode = cfg?.mode || fallbackMode;
    const clientId = cfg?.clientId || process.env.PAYPAL_CLIENT_ID || "";
    const clientSecret = cfg?.clientSecret || process.env.PAYPAL_CLIENT_SECRET || "";

    if (!clientId || !clientSecret) {
      throw new Error("Missing PayPal credentials");
    }

    const baseUrl = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PayPal connection failed (${response.status}): ${text.slice(0, 200)}`);
    }

    return { success: true, mode };
  }
}

export const payPalClientService = new PayPalClientService();
