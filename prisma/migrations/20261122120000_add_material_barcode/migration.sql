-- QR code / barcode of a material, unique within a company (NULLs allowed).
ALTER TABLE `materials` ADD COLUMN `barcode` VARCHAR(100) NULL;
CREATE UNIQUE INDEX `materials_company_id_barcode_key` ON `materials`(`company_id`, `barcode`);
