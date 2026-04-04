-- AlterTable product_variants: add lowStockThreshold (optional; when stock <= this = Low Stock)
ALTER TABLE `product_variants` ADD COLUMN `lowStockThreshold` INTEGER NULL;
