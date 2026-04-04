-- Add dual-currency totals on orders (EGP + USD)
ALTER TABLE `orders`
    ADD COLUMN `totalAmountEgp` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `totalAmountUsd` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `exchangeRateUsdToEgp` DECIMAL(10,4) NOT NULL DEFAULT 50.0000;

-- Backfill existing orders from current totalAmount (assumed EGP)
UPDATE `orders`
SET
    `totalAmountEgp` = `totalAmount`,
    `totalAmountUsd` = ROUND(`totalAmount` / NULLIF(`exchangeRateUsdToEgp`, 0), 2);
