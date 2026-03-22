ALTER TABLE `users` ADD COLUMN `auth_method` VARCHAR(30) NOT NULL DEFAULT 'password_only';

CREATE TABLE `webauthn_credentials` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `credential_id` VARCHAR(512) NOT NULL,
    `public_key` LONGTEXT NOT NULL,
    `counter` INTEGER NOT NULL DEFAULT 0,
    `transports` VARCHAR(255) NULL,
    `device_type` VARCHAR(50) NULL,
    `backed_up` BOOLEAN NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `webauthn_credentials_credential_id_key`(`credential_id`),
    INDEX `webauthn_credentials_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

ALTER TABLE `webauthn_credentials` ADD CONSTRAINT `webauthn_credentials_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `webauthn_challenges` ADD CONSTRAINT `webauthn_challenges_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
