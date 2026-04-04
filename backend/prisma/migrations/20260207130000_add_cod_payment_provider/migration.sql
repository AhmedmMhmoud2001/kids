-- AlterTable: add COD to PaymentProvider enum (for recording cash collected at DELIVERED)
ALTER TABLE `payments` MODIFY COLUMN `provider` ENUM('Stripe', 'Paymob', 'COD') NOT NULL;
