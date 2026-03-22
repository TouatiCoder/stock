ALTER TABLE `webauthn_credentials`
  ADD COLUMN `authenticator_attachment` VARCHAR(30) NULL;

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
