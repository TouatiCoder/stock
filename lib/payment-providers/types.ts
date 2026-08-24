export type ProviderCode = "stripe" | "paypal" | "cash";
export type ProviderMode = "test" | "live";

export type StripeProviderConfig = {
  test_secret_key?: string;
  live_secret_key?: string;
  test_webhook_secret?: string;
  live_webhook_secret?: string;
  test_publishable_key?: string;
  live_publishable_key?: string;
};

export type PayPalProviderConfig = {
  test_client_id?: string;
  test_client_secret?: string;
  live_client_id?: string;
  live_client_secret?: string;
  test_webhook_id?: string;
  live_webhook_id?: string;
};

export type CashProviderConfig = Record<string, never>;

export type PaymentProviderMaskedConfig = Record<string, string | null>;

export interface PaymentProviderDto {
  provider_code: ProviderCode;
  is_enabled: boolean;
  mode: ProviderMode;
  config: PaymentProviderMaskedConfig;
  created_at: string;
  updated_at: string;
}

export interface UpdatePaymentProviderInput {
  is_enabled: boolean;
  mode: ProviderMode;
  config?: Record<string, string | null | undefined>;
}
