-- Add_Foreign_Key
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
