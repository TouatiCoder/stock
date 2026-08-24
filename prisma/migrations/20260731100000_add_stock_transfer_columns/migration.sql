ALTER TABLE `stock_movements`
  ADD COLUMN `source_type` VARCHAR(30) NULL AFTER `movement_type`,
  ADD COLUMN `source_warehouse_id` VARCHAR(255) NULL AFTER `source_type`,
  ADD COLUMN `destination_type` VARCHAR(30) NULL AFTER `source_warehouse_id`,
  ADD COLUMN `destination_warehouse_id` VARCHAR(255) NULL AFTER `destination_type`;

CREATE INDEX `stock_movements_source_warehouse_id_movement_date_idx`
  ON `stock_movements`(`source_warehouse_id`, `movement_date`);

CREATE INDEX `stock_movements_destination_warehouse_id_movement_date_idx`
  ON `stock_movements`(`destination_warehouse_id`, `movement_date`);
