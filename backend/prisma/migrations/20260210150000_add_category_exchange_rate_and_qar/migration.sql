-- Extend category currency enum and add per-category exchange rate to EGP
ALTER TABLE `categories`
    MODIFY COLUMN `currencyCode` ENUM('EGP', 'USD', 'AED', 'EUR', 'QAR') NOT NULL DEFAULT 'EGP',
    ADD COLUMN `exchangeRateToEgp` DECIMAL(10,4) NOT NULL DEFAULT 1.0000;
