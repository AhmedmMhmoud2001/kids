/*
  Warnings:

  - You are about to alter the column `status` on the `order_next_push_logs` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(8))`.

*/
-- AlterTable
ALTER TABLE `order_next_push_logs` MODIFY `status` ENUM('QUEUED', 'ADDED', 'UNAVAILABLE', 'FAILED') NOT NULL DEFAULT 'QUEUED';

-- AlterTable
ALTER TABLE `product_variants` ADD COLUMN `available` BOOLEAN NOT NULL DEFAULT true,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `static_pages` ADD COLUMN `contentAr` LONGTEXT NULL,
    ADD COLUMN `contentEn` LONGTEXT NULL,
    MODIFY `content` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `offers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `discountPercent` DOUBLE NULL,
    `discountAmount` DOUBLE NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'PRODUCT',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NULL,
    `brandId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `offers_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
