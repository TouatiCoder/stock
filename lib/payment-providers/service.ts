import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { decryptConfigObject, encryptConfigObject } from "@/lib/payment-providers/encryption";
import type {
  PayPalProviderConfig,
  PaymentProviderDto,
  ProviderCode,
  ProviderMode,
  StripeProviderConfig,
  UpdatePaymentProviderInput,
} from "@/lib/payment-providers/types";

const PROVIDERS: ProviderCode[] = ["stripe", "paypal", "cash"];

const STRIPE_KEYS = [
  "test_secret_key",
  "live_secret_key",
  "test_webhook_secret",
  "live_webhook_secret",
  "test_publishable_key",
  "live_publishable_key",
] as const;

const PAYPAL_KEYS = [
  "test_client_id",
  "test_client_secret",
  "live_client_id",
  "live_client_secret",
  "test_webhook_id",
  "live_webhook_id",
] as const;

const CASH_KEYS = [] as const;

type DbClient = Prisma.TransactionClient | typeof db;

type ProviderRow = {
  provider_code: string;
  is_enabled: number | boolean;
  mode: string;
  config_encrypted: string | null;
  created_at: Date;
  updated_at: Date;
};

const isProviderCode = (value: string): value is ProviderCode => PROVIDERS.includes(value as ProviderCode);
const validateMode = (mode: string): mode is ProviderMode => mode === "test" || mode === "live";
const asBool = (value: number | boolean) => (typeof value === "boolean" ? value : value === 1);

const maskSecret = (value?: string | null) => {
  if (!value) return null;
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
};

const emptyForKeys = (keys: readonly string[]) =>
  keys.reduce<Record<string, string | null>>((acc, k) => {
    acc[k] = null;
    return acc;
  }, {});

export class PaymentProvidersService {
  async ensureProviders(client: DbClient = db) {
    await client.$executeRaw(Prisma.sql`
      INSERT IGNORE INTO payment_providers
      (id, provider_code, is_enabled, mode, config_encrypted, created_at, updated_at)
      VALUES (UUID(), 'stripe', 1, 'test', NULL, CURRENT_TIMESTAMP, UTC_TIMESTAMP())
    `);

    await client.$executeRaw(Prisma.sql`
      INSERT IGNORE INTO payment_providers
      (id, provider_code, is_enabled, mode, config_encrypted, created_at, updated_at)
      VALUES (UUID(), 'paypal', 0, 'test', NULL, CURRENT_TIMESTAMP, UTC_TIMESTAMP())
    `);

    await client.$executeRaw(Prisma.sql`
      INSERT IGNORE INTO payment_providers
      (id, provider_code, is_enabled, mode, config_encrypted, created_at, updated_at)
      VALUES (UUID(), 'cash', 1, 'test', NULL, CURRENT_TIMESTAMP, UTC_TIMESTAMP())
    `);
  }

  async listProviders(): Promise<PaymentProviderDto[]> {
    await this.ensureProviders();
    const rows = await db.$queryRaw<ProviderRow[]>(Prisma.sql`
      SELECT provider_code, is_enabled, mode, config_encrypted, created_at, updated_at
      FROM payment_providers
      ORDER BY provider_code ASC
    `);
    return rows.map((row) => this.toMaskedDto(row));
  }

  async updateProvider(providerCode: string, input: UpdatePaymentProviderInput): Promise<PaymentProviderDto> {
    if (!isProviderCode(providerCode)) throw new Error("Invalid provider");
    if (!validateMode(input.mode)) throw new Error("Invalid mode");

    return db.$transaction(async (tx) => {
      await this.ensureProviders(tx);

      const currentRows = await tx.$queryRaw<ProviderRow[]>(Prisma.sql`
        SELECT provider_code, is_enabled, mode, config_encrypted, created_at, updated_at
        FROM payment_providers
        WHERE provider_code = ${providerCode}
        LIMIT 1
        FOR UPDATE
      `);
      const current = currentRows[0];
      if (!current) throw new Error("Provider not found");

      const decrypted = decryptConfigObject(current.config_encrypted);
      const merged: Record<string, string> = { ...decrypted };
      if (input.config) {
        for (const [k, v] of Object.entries(input.config)) {
          if (typeof v === "string" && v.trim() !== "") {
            merged[k] = v.trim();
          }
        }
      }

      this.validateProviderRequirements(providerCode, input.mode, merged, input.is_enabled);

      if (!input.is_enabled) {
        const countRows = await tx.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
          SELECT COUNT(*) AS total
          FROM payment_providers
          WHERE is_enabled = 1 AND provider_code <> ${providerCode}
        `);
        const total = Number(countRows[0]?.total || 0);
        if (total < 1) {
          throw new Error("At least one payment provider must remain enabled");
        }
      }

      await tx.$executeRaw(Prisma.sql`
        UPDATE payment_providers
        SET
          is_enabled = ${input.is_enabled ? 1 : 0},
          mode = ${input.mode},
          config_encrypted = ${encryptConfigObject(merged)},
          updated_at = UTC_TIMESTAMP()
        WHERE provider_code = ${providerCode}
      `);

      const updatedRows = await tx.$queryRaw<ProviderRow[]>(Prisma.sql`
        SELECT provider_code, is_enabled, mode, config_encrypted, created_at, updated_at
        FROM payment_providers
        WHERE provider_code = ${providerCode}
        LIMIT 1
      `);

      return this.toMaskedDto(updatedRows[0]);
    });
  }

  async getStripeRuntimeConfig() {
    await this.ensureProviders();
    const rows = await db.$queryRaw<ProviderRow[]>(Prisma.sql`
      SELECT provider_code, is_enabled, mode, config_encrypted, created_at, updated_at
      FROM payment_providers
      WHERE provider_code = 'stripe'
      LIMIT 1
    `);
    const provider = rows[0];
    if (!provider || !asBool(provider.is_enabled)) return null;

    const cfg = decryptConfigObject(provider.config_encrypted) as StripeProviderConfig;
    const mode = provider.mode as ProviderMode;
    if (mode === "live") {
      return {
        mode,
        secretKey: cfg.live_secret_key || null,
        webhookSecret: cfg.live_webhook_secret || null,
        publishableKey: cfg.live_publishable_key || null,
      };
    }

    return {
      mode,
      secretKey: cfg.test_secret_key || null,
      webhookSecret: cfg.test_webhook_secret || null,
      publishableKey: cfg.test_publishable_key || null,
    };
  }

  async getPayPalRuntimeConfig() {
    await this.ensureProviders();
    const rows = await db.$queryRaw<ProviderRow[]>(Prisma.sql`
      SELECT provider_code, is_enabled, mode, config_encrypted, created_at, updated_at
      FROM payment_providers
      WHERE provider_code = 'paypal'
      LIMIT 1
    `);
    const provider = rows[0];
    if (!provider || !asBool(provider.is_enabled)) return null;

    const cfg = decryptConfigObject(provider.config_encrypted) as PayPalProviderConfig;
    const mode = provider.mode as ProviderMode;
    if (mode === "live") {
      return {
        mode,
        clientId: cfg.live_client_id || null,
        clientSecret: cfg.live_client_secret || null,
        webhookId: cfg.live_webhook_id || null,
      };
    }

    return {
      mode,
      clientId: cfg.test_client_id || null,
      clientSecret: cfg.test_client_secret || null,
      webhookId: cfg.test_webhook_id || null,
    };
  }

  private validateProviderRequirements(
    provider: ProviderCode,
    mode: ProviderMode,
    config: Record<string, string>,
    isEnabled: boolean,
  ) {
    if (!isEnabled) return;
    if (provider === "cash") return;

    if (provider === "stripe") {
      const required =
        mode === "live"
          ? ["live_secret_key", "live_webhook_secret"]
          : ["test_secret_key", "test_webhook_secret"];
      for (const field of required) {
        if (!config[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      return;
    }

    const required =
      mode === "live"
        ? ["live_client_id", "live_client_secret"]
        : ["test_client_id", "test_client_secret"];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  private toMaskedDto(row: ProviderRow): PaymentProviderDto {
    const config = decryptConfigObject(row.config_encrypted);
    const keys = row.provider_code === "stripe" ? STRIPE_KEYS : row.provider_code === "paypal" ? PAYPAL_KEYS : CASH_KEYS;
    const masked = emptyForKeys(keys);
    for (const key of keys) {
      masked[key] = maskSecret(config[key]);
    }

    return {
      provider_code: row.provider_code as ProviderCode,
      is_enabled: asBool(row.is_enabled),
      mode: row.mode as ProviderMode,
      config: masked,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}

export const paymentProvidersService = new PaymentProvidersService();
