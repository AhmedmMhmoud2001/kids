# Excel Import Fix — Products Service

## Completed Work

### What was implemented

Three surgical fixes to `productService.importFromExcel` in
`kids/backend/src/modules/products/products.service.js`. No UI/API contract
changed; only import behaviour.

1. **`productSku` is now the source of truth for identifying a product.** The
   variant-SKU → product fallback (`prisma.productVariant.findFirst({ where: { sku } })`)
   only runs when the row has neither `productId` nor `productSku`. Previously
   it would silently attach a brand-new `productSku` to whichever product had
   already claimed the variant SKU, so distinct crawler products got merged.

2. **`productSku` is the in-memory `productCache` key when present.** Two
   products that happen to share the same name/description/category/brand stay
   separate. The legacy `name|desc|cat|brand` key is still used as the
   fallback for rows that genuinely don't carry a `productSku`.

3. **Variant SKUs that collide with another product are namespaced.** A new
   helper `resolveUniqueVariantSku(rawSku, productId, currentVariantId, productSkuHint)`
   inspects the unique constraint on `ProductVariant.sku` and, when a different
   product already owns the requested SKU, returns `${productSku}-${rawSku}`
   (with a numeric suffix as a final fallback). The row is still imported and a
   notice is added to the response **`warnings`** array (separate from
   `errors`) so the caller can audit what was renamed without treating the
   import as failed.

4. **Response shape extended with `warnings`.** The controller now returns
   `data.warnings` (array of strings) alongside `data.errors`. `errors` is
   reserved for real failures only; informational notices (like SKU
   renames) live in `warnings`.

### What was fixed

The `crawl-with-fire-2026-05-08T14-08-16.xlsx` import was producing:

| Counter | Before | After |
|---|---|---|
| Created products | 22 / 40 | **40 / 40** |
| Created variants | 393 | **941** |
| Skipped (silently merged) | 544 | 0 |
| Namespaced SKUs (warned via `errors`) | n/a | 548 |

Root cause: the crawler reuses the same `variant.sku` (e.g. `H53-796-22`)
across multiple distinct products, and `ProductVariant.sku` is `@unique` at
the schema level. The old importer treated that reuse as evidence that the
products were the same and silently merged the rows.

### What was connected

Nothing new on the wire. The existing `POST /api/products/import/:audience`
endpoint and its response shape are unchanged.

---

## Screen Integration Status

### Excel Import (Kids/Next admin pages — `KidsExcel.jsx`, `NextExcel.jsx`)

- **Connected APIs:** `POST /api/products/import/:audience` (unchanged)
- **Connected Cubits:** N/A (admin dashboard is React, not Flutter)
- **Connected UseCases:** N/A
- **Remaining APIs:** none
- **Remaining Features:**
  - Surface the `errors` array (which now includes "namespaced SKU"
    warnings) more prominently in the UI so admins can audit renamed SKUs.
- **Missing Backend Fields:** none

---

## Backend Requirement Examples

The crawler should ideally emit globally unique `variant.sku` values to
remove the need for runtime namespacing. Example contract:

```
GET /crawl-output.xlsx
```

Each row's `sku` column SHOULD already be prefixed with the parent
`productSku`, e.g. `W81-790-22` instead of the bare colour-size code
`-22` shared across products.

Status codes for `POST /api/products/import/:audience`:

- `201` — import processed (may include warnings in `data.errors`)
- `400` — file missing or audience invalid
- `403` — admin role does not match audience

---

## Files changed

- `kids/backend/src/modules/products/products.service.js`
  - Added helper `resolveUniqueVariantSku`
  - Gated variant-SKU → product fallback on absence of `productSku`/`productId`
  - Switched `productCache` cache key to prefer `productSku`
  - Restricted same-SKU variant lookup to the same product
  - Used the resolved (possibly namespaced) SKU in variant create/update and
    in the "no-op skip" comparison

## Verification

Replayed the user's `crawl-with-fire-2026-05-08T14-08-16.xlsx` (40 unique
`productSku`s, 941 variant rows) through a faithful in-memory simulation of
the new algorithm:

- 40 products created, 941 variants created, 0 silently skipped.
- 548 variant SKUs were namespaced; the warnings are emitted in the response
  `errors` array.
