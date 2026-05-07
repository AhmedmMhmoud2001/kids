# next.co.uk cart-push flow

Lets an admin fulfil a customer order for `Audience = NEXT` products by
pushing the items into their own next.co.uk basket with one click instead
of re-buying by hand.

## Moving parts

1. **Product data** — each NEXT `Product` carries `sourceUrl` + `externalSku`
   and each `ProductVariant` carries `externalSku`, `externalColor`,
   `externalSize`. These are populated by the Excel import path
   (`POST /api/products/import/next`) from an `xlsx` produced by the
   `crawl-with-fire` scraper.
2. **Admin UI** — `NextPushPanel` inside the order detail modal
   (`admin_dashboard/src/components/orders/NextPushPanel.jsx`) renders a
   **Push to next.co.uk** button. On click it:
   1. `POST /api/orders/:id/next-push/start` — server enqueues a `QUEUED`
      row per NEXT item and returns `{ correlationId, items: [...] }`.
   2. `window.postMessage({ type: 'NEXT_CART_PUSH', correlationId, orderId, items })`.
   3. Polls `GET /api/orders/:id/next-push` every 2s for live status.
3. **Browser extension** (`A:/next-cart-extension/`) picks up the
   postMessage, opens one next.co.uk tab per item, automates
   colour/size/add-to-bag, and reports results back via
   `POST /api/orders/:id/next-push/result`.
4. **Audit log** — `order_next_push_logs` keeps history of every push
   attempt (`QUEUED | ADDED | UNAVAILABLE | FAILED`), grouped by
   `correlationId`.

## Migration

The schema change is delivered as migration
`20260424120000_add_next_source_fields_and_push_log`. Apply in the
normal way:

```bash
cd backend
npm run db:migrate   # prisma migrate deploy
```

## RBAC

Push endpoints are gated to `SYSTEM_ADMIN | ADMIN_NEXT`. `ADMIN_KIDS` cannot
see or trigger a push.

## Extending — when a push fails

- **"Missing next.co.uk URL on product X"** — open the product in the admin
  dashboard, paste the URL into the "Next.co.uk URL" field, save. Re-import
  the Excel to bulk-fix.
- **`UNAVAILABLE`** — the variant is genuinely out of stock on next.co.uk
  (`available: false`), or colour/size label on our record doesn't
  match exact label on site. Compare `ProductVariant.externalColor / externalSize`
  to swatch label on the live product page; update via
  variant edit modal.
  or the colour/size label on our record doesn't match the exact label on
  the site. Compare `ProductVariant.externalColor / externalSize` to the
  swatch label on the live product page; update via the variant edit modal.
- **`FAILED`** — the DOM layout has changed. Update selectors in
  `A:/next-cart-extension/next-agent.js` (grouped inside `selectColor`,
  `selectSize`, `findAddToBagButton`).

## Design notes

- No headless browser on the backend: the extension rides the admin's own
  next.co.uk login, so no next.co.uk credentials are stored server-side.
- `correlationId` uniqueness (`@@unique([correlationId, orderItemId])`)
  means `POST /next-push/result` is idempotent — re-reporting the same
  outcome is safe.
- Order audience is derived from items, not stored on `Order`, so the
  button appears for any order with at least one NEXT item; mixed orders
  only push the NEXT items.
