-- Add available column to ProductVariant model
-- This column is populated by crawl-with-fire Excel import
-- false if variant is out of stock, unavailable, or sold out; true otherwise

ALTER TABLE ProductVariant ADD COLUMN available BOOLEAN NOT NULL DEFAULT(true);
