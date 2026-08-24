import { logBilling } from "@/lib/billing/logger";

export class BillingSlackNotifier {
  private getWebhookUrl() {
    return process.env.BILLING_ALERTS_SLACK_WEBHOOK_URL || "";
  }

  async notify(title: string, details: Record<string, unknown>) {
    const webhook = this.getWebhookUrl();
    if (!webhook) {
      logBilling("warn", "Slack webhook not configured for billing alerts", { title, details });
      return;
    }

    const text = [
      `*${title}*`,
      ...Object.entries(details).map(([k, v]) => `- ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`),
    ].join("\n");

    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const body = await response.text();
        logBilling("error", "Failed to send Slack alert", {
          status: response.status,
          body,
          title,
        });
      }
    } catch (error) {
      logBilling("error", "Slack alert request failed", {
        title,
        error: error instanceof Error ? error.message : "Unknown slack error",
      });
    }
  }
}

export const billingSlackNotifier = new BillingSlackNotifier();
