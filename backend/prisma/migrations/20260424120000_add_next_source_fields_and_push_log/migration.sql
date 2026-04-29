-- Add next.co.uk source-reference fields on products
ALTER TABLE `products`
  ADD COLUMN `sourceUrl` VARCHAR(500) NULL,
  ADD COLUMN `externalSku` VARCHAR(100) NULL;

-- Add next.co.uk per-variant fields used by the browser-extension cart push
ALTER TABLE `product_variants`
  ADD COLUMN `externalSku` VARCHAR(100) NULL,
  ADD COLUMN `externalColor` VARCHAR(100) NULL,
  ADD COLUMN `externalSize` VARCHAR(50) NULL;

-- Audit log for next.co.uk cart-push attempts triggered from the admin order view
CREATE TABLE `order_next_push_logs` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `orderItemId` VARCHAR(191) NOT NULL,
  `correlationId` VARCHAR(36) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'QUEUED',
  `message` TEXT NULL,
  `pushedBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `order_next_push_logs_correlationId_orderItemId_key`(`correlationId`, `orderItemId`),
  INDEX `order_next_push_logs_orderId_idx`(`orderId`),
  INDEX `order_next_push_logs_correlationId_idx`(`correlationId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `order_next_push_logs`
  ADD CONSTRAINT `order_next_push_logs_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `order_next_push_logs`
  ADD CONSTRAINT `order_next_push_logs_orderItemId_fkey`
    FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
