import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

export const biometricService = {
  async registerBiometric() {
    const optionsRes = await fetch("/api/webauthn/register/options", { method: "POST" });
    const optionsData = await optionsRes.json();
    if (!optionsRes.ok) throw new Error(optionsData.error || "Failed to create registration options");

    const registrationResponse = await startRegistration(optionsData.options);

    const verifyRes = await fetch("/api/webauthn/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: registrationResponse }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(verifyData.error || "Biometric registration failed");

    return verifyData;
  },

  async verifyBiometric() {
    const optionsRes = await fetch("/api/webauthn/login/options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const optionsData = await optionsRes.json();
    if (!optionsRes.ok) throw new Error(optionsData.error || "Failed to create authentication options");
    if (!optionsData.available) {
      throw new Error("No biometric-enabled accounts available");
    }

    const assertionResponse = await startAuthentication(optionsData.options);

    const verifyRes = await fetch("/api/webauthn/login/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: optionsData.challengeId, response: assertionResponse }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(verifyData.error || "Biometric login failed");

    return verifyData;
  },

  async hasBiometricCredentials() {
    const res = await fetch("/api/webauthn/credentials", { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.hasBiometric);
  },

  async deleteBiometricCredentials() {
    const res = await fetch("/api/webauthn/credentials", { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete credentials");
    return data;
  },

  isWebAuthnSupported(): boolean {
    return !!(
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential === "function" &&
      navigator.credentials &&
      typeof navigator.credentials.create === "function"
    );
  },
};


