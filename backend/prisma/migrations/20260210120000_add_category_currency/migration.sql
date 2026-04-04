-- Add per-category currency code
ALTER TABLE `categories`
    ADD COLUMN `currencyCode` ENUM('EGP', 'USD', 'AED', 'EUR') NOT NULL DEFAULT 'EGP';
