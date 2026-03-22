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

ALTER TABLE `tool_calculations` ADD CONSTRAINT `tool_calculations_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `tool_calculations` ADD CONSTRAINT `tool_calculations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `tool_calculations` ADD CONSTRAINT `tool_calculations_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
