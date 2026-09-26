-- Adds the three tables that exist in schema.prisma but were never created by a
-- migration (they had only ever been applied with `prisma db push` on the dev
-- machine), which made the app fail on a freshly provisioned database with:
--   P2021 The table `checklists` does not exist in the current database.
--
-- Written to be safe to run on a database that already has some of them:
-- `CREATE TABLE IF NOT EXISTS` with the foreign keys declared inline, so an
-- existing table is left untouched instead of raising "table already exists" /
-- "duplicate foreign key constraint name".

-- CreateTable
CREATE TABLE IF NOT EXISTS `checklists` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `project_id` VARCHAR(255) NULL,
    `created_by` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `checklist_type` VARCHAR(50) NOT NULL DEFAULT 'general',
    `status` VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    `completed_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `checklists_company_id_status_created_at_idx`(`company_id`, `status`, `created_at`),
    INDEX `checklists_project_id_created_at_idx`(`project_id`, `created_at`),
    INDEX `checklists_created_by_created_at_idx`(`created_by`, `created_at`),
    PRIMARY KEY (`id`),

    CONSTRAINT `checklists_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `checklists_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `checklists_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `checklist_items` (
    `id` VARCHAR(255) NOT NULL,
    `checklist_id` VARCHAR(255) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `is_checked` BOOLEAN NOT NULL DEFAULT false,
    `position` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `checklist_items_checklist_id_position_idx`(`checklist_id`, `position`),
    PRIMARY KEY (`id`),

    CONSTRAINT `checklist_items_checklist_id_fkey` FOREIGN KEY (`checklist_id`) REFERENCES `checklists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `plan_payments` (
    `id` VARCHAR(255) NOT NULL,
    `company_id` VARCHAR(255) NOT NULL,
    `requested_by` VARCHAR(255) NOT NULL,
    `plan_code` VARCHAR(30) NOT NULL,
    `cadence` VARCHAR(20) NOT NULL,
    `amount_mad` INTEGER NOT NULL,
    `method` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `stripe_checkout_session_id` VARCHAR(255) NULL,
    `confirmed_by` VARCHAR(255) NULL,
    `rejected_reason` VARCHAR(255) NULL,
    `paid_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `plan_payments_company_id_status_created_at_idx`(`company_id`, `status`, `created_at`),
    INDEX `plan_payments_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`),

    CONSTRAINT `plan_payments_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `plan_payments_requested_by_fkey` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `plan_payments_confirmed_by_fkey` FOREIGN KEY (`confirmed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
