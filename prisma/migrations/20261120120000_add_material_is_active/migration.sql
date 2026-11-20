-- Archive flag for materials: a material used by purchase orders or stock
-- movements is archived (is_active = false) instead of being deleted.
ALTER TABLE `materials` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;
