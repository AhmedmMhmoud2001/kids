-- CreateTable: colors (for product variants)
CREATE TABLE `colors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `hex` VARCHAR(7) NULL,

    UNIQUE INDEX `colors_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: sizes (for product variants)
CREATE TABLE `sizes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sizes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable products: add basePrice, then make price/sku/stock nullable
ALTER TABLE `products` ADD COLUMN `basePrice` DOUBLE NOT NULL DEFAULT 0;

UPDATE `products` SET `basePrice` = COALESCE(CAST(`price` AS DOUBLE), 0);

ALTER TABLE `products` MODIFY COLUMN `price` DECIMAL(10, 2) NULL,
    MODIFY COLUMN `sku` VARCHAR(191) NULL,
    MODIFY COLUMN `stock` INTEGER NULL;

-- CreateTable: product_variants
CREATE TABLE `product_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `price` DOUBLE NULL,
    `stock` INTEGER NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `productId` INTEGER NOT NULL,
    `colorId` INTEGER NOT NULL,
    `sizeId` INTEGER NOT NULL,

    UNIQUE INDEX `product_variants_sku_key`(`sku`),
    UNIQUE INDEX `product_variants_productId_colorId_sizeId_key`(`productId`, `colorId`, `sizeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey product_variants -> products
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey product_variants -> colors
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `colors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey product_variants -> sizes
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `sizes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable cart_items: add productVariantId, make productId nullable
ALTER TABLE `cart_items` ADD COLUMN `productVariantId` INTEGER NULL,
    MODIFY COLUMN `productId` INTEGER NULL;

-- AddForeignKey cart_items -> product_variants (Cascade: delete cart item when variant deleted)
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable order_items: add productVariantId
ALTER TABLE `order_items` ADD COLUMN `productVariantId` INTEGER NULL;

-- AddForeignKey order_items -> product_variants (optional relation)
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
