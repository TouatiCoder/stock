-- CreateTable
CREATE TABLE `companies` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `siret` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `postal_code` VARCHAR(20) NULL,
    `tax_rate` DECIMAL(5, 2) NULL,
    `bank_info` TEXT NULL,
    `ice` VARCHAR(100) NULL,
    `if_id` VARCHAR(100) NULL,
    `subscription_payment_method` VARCHAR(50) NULL,
    `currency` VARCHAR(10) NULL DEFAULT 'MAD',
    `country` VARCHAR(100) NULL DEFAULT 'Maroc',
    `timezone` VARCHAR(50) NULL DEFAULT 'Africa/Casablanca',
    `plan` VARCHAR(50) NULL DEFAULT 'free',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `suspended_at` DATETIME(0) NULL,
    `suspended_reason` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_providers` (
    `id` VARCHAR(255) NOT NULL,
    `provider_code` VARCHAR(30) NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT false,
    `mode` VARCHAR(10) NOT NULL DEFAULT 'test',
    `config_encrypted` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `payment_providers_provider_code_key`(`provider_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_settings` (
    `id` VARCHAR(255) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` VARCHAR(255) NOT NULL,
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `platform_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plans` (
    `id` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `plans_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_features` (
    `id` VARCHAR(255) NOT NULL,
    `plan_id` VARCHAR(255) NOT NULL,
    `feature_code` VARCHAR(100) NOT NULL,
    `limit_value` INTEGER NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `plan_features_feature_code_idx`(`feature_code`),
    UNIQUE INDEX `plan_features_plan_id_feature_code_key`(`plan_id`, `feature_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `plan_id` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `trial_ends_at` DATETIME(0) NULL,
    `current_period_end` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `subscriptions_company_id_created_at_idx`(`company_id`, `created_at`),
    INDEX `subscriptions_company_id_status_idx`(`company_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_status_audits` (
    `id` VARCHAR(255) NOT NULL,
    `subscription_id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `old_status` VARCHAR(50) NOT NULL,
    `new_status` VARCHAR(50) NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `subscription_status_audits_company_id_created_at_idx`(`company_id`, `created_at`),
    INDEX `subscription_status_audits_subscription_id_created_at_idx`(`subscription_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billing_accounts` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `stripe_customer_id` VARCHAR(255) NOT NULL,
    `default_currency` VARCHAR(10) NOT NULL DEFAULT 'usd',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `billing_accounts_company_id_key`(`company_id`),
    UNIQUE INDEX `billing_accounts_stripe_customer_id_key`(`stripe_customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billing_plan_prices` (
    `id` VARCHAR(255) NOT NULL,
    `plan_code` VARCHAR(50) NOT NULL,
    `billing_interval` VARCHAR(20) NOT NULL,
    `currency` VARCHAR(10) NOT NULL,
    `stripe_product_id` VARCHAR(255) NOT NULL,
    `stripe_price_id` VARCHAR(255) NOT NULL,
    `unit_amount_cents` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `version` INTEGER NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `billing_plan_prices_stripe_price_id_key`(`stripe_price_id`),
    INDEX `billing_plan_prices_plan_code_billing_interval_currency_is_a_idx`(`plan_code`, `billing_interval`, `currency`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billing_subscriptions_external` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `stripe_subscription_id` VARCHAR(255) NOT NULL,
    `stripe_customer_id` VARCHAR(255) NOT NULL,
    `stripe_price_id` VARCHAR(255) NULL,
    `status` VARCHAR(50) NOT NULL,
    `current_period_end` DATETIME(0) NULL,
    `cancel_at_period_end` BOOLEAN NOT NULL DEFAULT false,
    `last_event_created_at` DATETIME(0) NULL,
    `last_event_id` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `billing_subscriptions_external_company_id_key`(`company_id`),
    UNIQUE INDEX `billing_subscriptions_external_stripe_subscription_id_key`(`stripe_subscription_id`),
    INDEX `billing_subscriptions_external_stripe_customer_id_updated_at_idx`(`stripe_customer_id`, `updated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stripe_webhook_events` (
    `id` VARCHAR(255) NOT NULL,
    `event_id` VARCHAR(255) NOT NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `stripe_object_id` VARCHAR(255) NULL,
    `company_id` VARCHAR(255) NULL,
    `payload_json` JSON NOT NULL,
    `processing_status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `attempt_count` INTEGER NOT NULL DEFAULT 0,
    `received_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `processed_at` DATETIME(0) NULL,
    `next_retry_at` DATETIME(0) NULL,
    `last_error` VARCHAR(1000) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `stripe_webhook_events_event_id_key`(`event_id`),
    INDEX `stripe_webhook_events_processing_status_next_retry_at_idx`(`processing_status`, `next_retry_at`),
    INDEX `stripe_webhook_events_company_id_created_at_idx`(`company_id`, `created_at`),
    INDEX `stripe_webhook_events_processing_status_updated_at_idx`(`processing_status`, `updated_at`),
    INDEX `stripe_webhook_events_received_at_idx`(`received_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billing_checkout_sessions` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `stripe_checkout_session_id` VARCHAR(255) NOT NULL,
    `stripe_customer_id` VARCHAR(255) NULL,
    `target_plan_code` VARCHAR(50) NOT NULL,
    `target_interval` VARCHAR(20) NOT NULL,
    `idempotency_key` VARCHAR(255) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'created',
    `expires_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `billing_checkout_sessions_stripe_checkout_session_id_key`(`stripe_checkout_session_id`),
    INDEX `billing_checkout_sessions_company_id_created_at_idx`(`company_id`, `created_at`),
    INDEX `billing_checkout_sessions_idempotency_key_company_id_idx`(`idempotency_key`, `company_id`),
    INDEX `billing_checkout_sessions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `billing_job_runs` (
    `id` VARCHAR(255) NOT NULL,
    `job_name` VARCHAR(100) NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    `company_id` VARCHAR(255) NULL,
    `started_at` DATETIME(0) NOT NULL,
    `finished_at` DATETIME(0) NOT NULL,
    `summary_json` JSON NULL,
    `error_message` VARCHAR(1000) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `billing_job_runs_job_name_finished_at_idx`(`job_name`, `finished_at`),
    INDEX `billing_job_runs_status_finished_at_idx`(`status`, `finished_at`),
    INDEX `billing_job_runs_company_id_finished_at_idx`(`company_id`, `finished_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feature_usages` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `feature_code` VARCHAR(100) NOT NULL,
    `usage_count` INTEGER NOT NULL DEFAULT 0,
    `reset_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `feature_usages_feature_code_idx`(`feature_code`),
    UNIQUE INDEX `feature_usages_company_id_feature_code_key`(`company_id`, `feature_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `auth_method` VARCHAR(30) NOT NULL DEFAULT 'password_only',
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `is_platform_admin` BOOLEAN NOT NULL DEFAULT false,
    `last_login_at` DATETIME(0) NULL,
    `reset_token` VARCHAR(255) NULL,
    `reset_token_expiry` DATETIME(0) NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_reset_token_key`(`reset_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_setting_audits` (
    `id` VARCHAR(255) NOT NULL,
    `setting_key` VARCHAR(100) NOT NULL,
    `old_value` VARCHAR(255) NULL,
    `new_value` VARCHAR(255) NOT NULL,
    `actor_user_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `platform_setting_audits_setting_key_created_at_idx`(`setting_key`, `created_at`),
    INDEX `platform_setting_audits_actor_user_id_created_at_idx`(`actor_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `client_name` VARCHAR(255) NULL,
    `client_email` VARCHAR(255) NULL,
    `client_phone` VARCHAR(50) NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `postal_code` VARCHAR(20) NULL,
    `project_type` VARCHAR(50) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'planning',
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `total_budget` DECIMAL(15, 2) NULL,
    `current_cost` DECIMAL(15, 2) NULL DEFAULT 0,
    `company_id` VARCHAR(255) NOT NULL,
    `site_manager_id` VARCHAR(255) NULL,
    `structural_engineer_id` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_expenses` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `project_id` VARCHAR(255) NOT NULL,
    `supplier_invoice_id` VARCHAR(255) NULL,
    `category` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `created_by` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `project_expenses_company_id_project_id_created_at_idx`(`company_id`, `project_id`, `created_at`),
    INDEX `project_expenses_project_id_created_at_idx`(`project_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materials` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `unit` VARCHAR(50) NOT NULL,
    `unit_price` DECIMAL(10, 2) NULL,
    `category` VARCHAR(100) NULL,
    `supplier_id` VARCHAR(255) NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `contact_person` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `company_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouses` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NULL,
    `capacity` DECIMAL(10, 2) NULL,
    `is_main` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `company_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory` (
    `id` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `min_threshold` DECIMAL(10, 2) NULL DEFAULT 0,
    `max_threshold` DECIMAL(10, 2) NULL,
    `material_id` VARCHAR(255) NOT NULL,
    `warehouse_id` VARCHAR(255) NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` VARCHAR(255) NOT NULL,
    `project_id` VARCHAR(255) NULL,
    `material_id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NULL,
    `movement_type` VARCHAR(20) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(255) NULL,
    `movement_date` DATETIME(0) NOT NULL,

    INDEX `stock_movements_material_id_movement_date_idx`(`material_id`, `movement_date`),
    INDEX `stock_movements_project_id_movement_date_idx`(`project_id`, `movement_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` VARCHAR(255) NOT NULL,
    `order_number` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `total_amount` DECIMAL(15, 2) NULL,
    `order_date` DATE NULL,
    `expected_delivery` DATE NULL,
    `actual_delivery` DATE NULL,
    `supplier_id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `created_by` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `purchase_orders_order_number_key`(`order_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order_items` (
    `id` VARCHAR(255) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(12, 2) NOT NULL,
    `notes` TEXT NULL,
    `purchase_order_id` VARCHAR(255) NOT NULL,
    `material_id` VARCHAR(255) NOT NULL,
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitations` (
    `id` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `accepted_at` DATETIME(0) NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `invited_by` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `invitations_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_subscriptions` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `plan_code` VARCHAR(50) NOT NULL DEFAULT 'starter',
    `status` VARCHAR(50) NOT NULL DEFAULT 'trialing',
    `trial_ends_at` DATETIME(0) NULL,
    `current_period_start` DATETIME(0) NULL,
    `current_period_end` DATETIME(0) NULL,
    `monthly_amount` DECIMAL(12, 2) NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'MAD',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `platform_subscriptions_company_id_key`(`company_id`),
    INDEX `platform_subscriptions_status_idx`(`status`),
    INDEX `platform_subscriptions_trial_ends_at_idx`(`trial_ends_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_payments` (
    `id` VARCHAR(255) NOT NULL,
    `subscription_id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `due_at` DATETIME(0) NULL,
    `paid_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `platform_payments_company_id_created_at_idx`(`company_id`, `created_at`),
    INDEX `platform_payments_status_created_at_idx`(`status`, `created_at`),
    INDEX `platform_payments_subscription_id_idx`(`subscription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `platform_company_status_events` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `actor_user_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `platform_company_status_events_company_id_created_at_idx`(`company_id`, `created_at`),
    INDEX `platform_company_status_events_actor_user_id_created_at_idx`(`actor_user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webauthn_credentials` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `credential_id` VARCHAR(512) NOT NULL,
    `public_key` LONGTEXT NOT NULL,
    `counter` INTEGER NOT NULL DEFAULT 0,
    `authenticator_attachment` VARCHAR(30) NULL,
    `transports` VARCHAR(255) NULL,
    `device_type` VARCHAR(50) NULL,
    `backed_up` BOOLEAN NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `webauthn_credentials_credential_id_key`(`credential_id`),
    INDEX `webauthn_credentials_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tool_calculations` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `project_id` VARCHAR(255) NULL,
    `tool_type` VARCHAR(30) NOT NULL,
    `input_json` JSON NOT NULL,
    `output_json` JSON NOT NULL,
    `notes` VARCHAR(500) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `tool_calculations_company_id_tool_type_created_at_idx`(`company_id`, `tool_type`, `created_at`),
    INDEX `tool_calculations_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `tool_calculations_project_id_created_at_idx`(`project_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webauthn_challenges` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `purpose` VARCHAR(30) NOT NULL,
    `challenge` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `webauthn_challenges_user_id_purpose_expires_at_idx`(`user_id`, `purpose`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webauthn_login_challenges` (
    `id` VARCHAR(255) NOT NULL,
    `challenge` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `webauthn_login_challenges_expires_at_created_at_idx`(`expires_at`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webauthn_login_attempts` (
    `id` VARCHAR(255) NOT NULL,
    `ip_address` VARCHAR(64) NOT NULL,
    `credential_id` VARCHAR(512) NULL,
    `success` BOOLEAN NOT NULL DEFAULT false,
    `reason` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `webauthn_login_attempts_ip_address_created_at_idx`(`ip_address`, `created_at`),
    INDEX `webauthn_login_attempts_success_created_at_idx`(`success`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(0) NULL,
    `metadata` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `notifications_user_id_is_read_created_at_idx`(`user_id`, `is_read`, `created_at`),
    INDEX `notifications_company_id_created_at_idx`(`company_id`, `created_at`),
    INDEX `notifications_type_created_at_idx`(`type`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `plan_features` ADD CONSTRAINT `plan_features_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription_status_audits` ADD CONSTRAINT `subscription_status_audits_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription_status_audits` ADD CONSTRAINT `subscription_status_audits_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billing_accounts` ADD CONSTRAINT `billing_accounts_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billing_subscriptions_external` ADD CONSTRAINT `billing_subscriptions_external_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stripe_webhook_events` ADD CONSTRAINT `stripe_webhook_events_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billing_checkout_sessions` ADD CONSTRAINT `billing_checkout_sessions_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `billing_job_runs` ADD CONSTRAINT `billing_job_runs_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feature_usages` ADD CONSTRAINT `feature_usages_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `platform_setting_audits` ADD CONSTRAINT `platform_setting_audits_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_site_manager_id_fkey` FOREIGN KEY (`site_manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_structural_engineer_id_fkey` FOREIGN KEY (`structural_engineer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouses` ADD CONSTRAINT `warehouses_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_invited_by_fkey` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `platform_subscriptions` ADD CONSTRAINT `platform_subscriptions_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `platform_payments` ADD CONSTRAINT `platform_payments_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `platform_subscriptions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `platform_payments` ADD CONSTRAINT `platform_payments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `platform_company_status_events` ADD CONSTRAINT `platform_company_status_events_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `platform_company_status_events` ADD CONSTRAINT `platform_company_status_events_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webauthn_credentials` ADD CONSTRAINT `webauthn_credentials_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tool_calculations` ADD CONSTRAINT `tool_calculations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tool_calculations` ADD CONSTRAINT `tool_calculations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tool_calculations` ADD CONSTRAINT `tool_calculations_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webauthn_challenges` ADD CONSTRAINT `webauthn_challenges_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

