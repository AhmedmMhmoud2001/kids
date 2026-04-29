-- Track when (and by whom) an admin marks a NEXT order as fulfilled after the next.co.uk checkout completes.
-- Independent of OrderStatus so it does not disturb stock/payment transitions.
ALTER TABLE `orders`
  ADD COLUMN `fulfilledAt` DATETIME(3) NULL,
  ADD COLUMN `fulfilledBy` VARCHAR(191) NULL;
