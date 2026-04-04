-- CreateTable: product_color_images (5 صور لكل لون)
CREATE TABLE `product_color_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `colorId` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,

    UNIQUE INDEX `product_color_images_productId_colorId_order_key`(`productId`, `colorId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey product_color_images -> products
ALTER TABLE `product_color_images` ADD CONSTRAINT `product_color_images_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey product_color_images -> colors
ALTER TABLE `product_color_images` ADD CONSTRAINT `product_color_images_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `colors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable product_variants: add createdAt, updatedAt; drop images; price NOT NULL
UPDATE `product_variants` SET `price` = 0 WHERE `price` IS NULL;
ALTER TABLE `product_variants` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `product_variants` DROP COLUMN `images`;
ALTER TABLE `product_variants` MODIFY COLUMN `price` DOUBLE NOT NULL;

-- AlterTable products: drop thumbnails, price, sku, stock, colors, sizes; basePrice nullable
ALTER TABLE `products` DROP COLUMN `thumbnails`,
    DROP COLUMN `price`,
    DROP COLUMN `sku`,
    DROP COLUMN `stock`,
    DROP COLUMN `colors`,
    DROP COLUMN `sizes`,
    MODIFY COLUMN `basePrice` DOUBLE NULL;

-- AlterTable colors: rename hex to hexCode
ALTER TABLE `colors` CHANGE COLUMN `hex` `hexCode` VARCHAR(7) NULL;
