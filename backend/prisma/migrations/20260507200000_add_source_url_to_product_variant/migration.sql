-- Per-colour next.co.uk URL on each variant. Each colourway is its own page on
-- next.co.uk; the existing product-level sourceUrl is shared across colours and
-- so cannot tell the cart-push extension which colour page to open per item.

ALTER TABLE `product_variants` ADD COLUMN `sourceUrl` VARCHAR(500) NULL;
