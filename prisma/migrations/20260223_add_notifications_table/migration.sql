CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(255) NOT NULL,
  `company_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NULL,
  `type_code` VARCHAR(100) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body_text` TEXT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `read_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_company_created` (`company_id`, `created_at`),
  KEY `idx_notifications_user_read` (`user_id`, `is_read`, `created_at`),
  KEY `idx_notifications_company_read` (`company_id`, `is_read`, `created_at`),
  CONSTRAINT `fk_notifications_company`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
