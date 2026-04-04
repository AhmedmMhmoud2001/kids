# Migration: Product Variants (سعر وكمية حسب اللون والحجم)

## التغييرات في الـ Schema

- **Product**: `basePrice` (Float) مطلوب، مع حقول اختيارية للتوافق: `price`, `sku`, `stock`, `colors`, `sizes`.
- **ProductVariant**: سعر وكمية و SKU لكل تركيبة (لون + حجم).
- **Color** و **Size**: جداول منفصلة للألوان والمقاسات.
- **CartItem**: يدعم `productVariantId` (عند الإضافة باللون/الحجم) أو `productId` + `selectedSize` + `selectedColor` (للتوافق).
- **OrderItem**: حقل اختياري `productVariantId` لتخزين الـ variant في الطلب.

## تشغيل الـ Migration

إذا كانت قاعدة البيانات تحتوي على منتجات حالية:

1. **إضافة عمود basePrice للمنتجات الحالية:**
   - في migration يدوي أو SQL: `ALTER TABLE products ADD COLUMN basePrice DOUBLE NOT NULL DEFAULT 0;`
   - ثم: `UPDATE products SET basePrice = price WHERE price IS NOT NULL;`
   - ثم جعل الحقول القديمة اختيارية: `ALTER TABLE products MODIFY price DECIMAL(10,2) NULL, MODIFY sku VARCHAR(255) NULL, MODIFY stock INT NULL;`

2. **إنشاء الجداول والعلاقات:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_product_variants
   ```
   إذا فشل بسبب بيانات موجودة، نفّذ الخطوة 1 يدوياً ثم أعد تشغيل الأمر.

## إنشاء منتج مع Variants من الـ API

**POST /api/products** مع body مثل:

```json
{
  "name": "تيشيرت أطفال",
  "description": "...",
  "basePrice": 99.5,
  "audience": "KIDS",
  "categoryId": 1,
  "brandId": 1,
  "thumbnails": ["https://..."],
  "isActive": true,
  "isBestSeller": false,
  "variants": [
    { "colorName": "أحمر", "sizeName": "S", "price": 99.5, "stock": 10, "sku": "KID-RED-S" },
    { "colorName": "أزرق", "sizeName": "M", "price": 105, "stock": 5, "sku": "KID-BLUE-M" }
  ]
}
```

أو استخدام `colorId` و `sizeId` إذا كانت الألوان والمقاسات موجودة مسبقاً في جداول Color و Size.

## إضافة للسلة (باللون والحجم)

**POST /api/cart/add** مع body:

- **عند استخدام variant:**  
  `{ "productVariantId": 1, "quantity": 2 }`
- **للتوافق (بدون variants):**  
  `{ "productId": 1, "selectedColor": "أحمر", "selectedSize": "S", "quantity": 1 }`

الفرونت يمكنه استدعاء `/api/products/:id` والحصول على `variants` مع كل variant (color, size, price, stock, sku) ثم إرسال `productVariantId` عند الإضافة للسلة.
