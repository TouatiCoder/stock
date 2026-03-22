ALTER TABLE `companies`
  ADD COLUMN IF NOT EXISTS `subscription_payment_method` VARCHAR(50) NULL;
