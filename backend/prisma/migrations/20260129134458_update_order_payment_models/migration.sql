/*
  Warnings:

  - You are about to drop the column `audience` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `orders` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.
  - You are about to alter the column `paymentMethod` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.
  - You are about to alter the column `shippingAddress` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.
  - Added the required column `priceAtPurchase` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `categories` ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `order_items` DROP COLUMN `audience`,
    DROP COLUMN `price`,
    DROP COLUMN `status`,
    ADD COLUMN `priceAtPurchase` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `paymentStatus`,
    DROP COLUMN `phone`,
    ADD COLUMN `billingInfo` JSON NULL,
    ADD COLUMN `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `shippingFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `subtotal` DECIMAL(10, 2) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'PAID', 'CANCELLED', 'SHIPPED', 'DELIVERED') NOT NULL DEFAULT 'PENDING',
    MODIFY `paymentMethod` ENUM('COD', 'CARD') NOT NULL DEFAULT 'COD',
    MODIFY `shippingAddress` JSON NULL;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `provider` ENUM('Stripe', 'Paymob') NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `amount` DECIMAL(10, 2) NOT NULL,
    `transactionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_transactionId_key`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
