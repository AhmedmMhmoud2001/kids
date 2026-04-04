-- AlterTable: add images (JSON array of URLs) to product_variants
ALTER TABLE `product_variants` ADD COLUMN `images` JSON NULL;
