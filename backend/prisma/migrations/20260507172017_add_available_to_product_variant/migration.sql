-- Add `available` column to ProductVariant model.
-- false when the variant is out of stock / unavailable / sold out, true otherwise.
-- Populated by the crawl-with-fire Excel import (which conveys availability via stock=0,
-- defaulting `available` to true here so existing rows stay marked in-stock).

ALTER TABLE `product_variants` ADD COLUMN `available` BOOLEAN NOT NULL DEFAULT true;
