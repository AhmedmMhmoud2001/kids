require('dotenv').config();
const prisma = require('./config/db');
const bcrypt = require('bcrypt');

const DAYS = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const toLocalized = (en, ar) => JSON.stringify({ en, ar });

const categories = [
  // Kids
  { name: 'Boys', slug: 'boys', audience: 'KIDS' },
  { name: 'Girls', slug: 'girls', audience: 'KIDS' },
  { name: 'Baby Boys', slug: 'baby-boys', audience: 'KIDS' },
  { name: 'Baby Girls', slug: 'baby-girls', audience: 'KIDS' },
  { name: 'Accessories', slug: 'accessories', audience: 'KIDS' },
  // Next
  { name: 'Boys', slug: 'boys', audience: 'NEXT' },
  { name: 'Girls', slug: 'girls', audience: 'NEXT' },
  { name: 'Baby Boys', slug: 'baby-boys', audience: 'NEXT' },
  { name: 'Baby Girls', slug: 'baby-girls', audience: 'NEXT' },
  { name: 'Accessories', slug: 'accessories', audience: 'NEXT' }
];

const brands = [
  { name: toLocalized('Nike', 'نايك'), slug: 'nike', image: 'https://placehold.co/200x80/111111/FFFFFF?text=NIKE', description: toLocalized('Leading sports brand for kids', 'علامة رياضية رائدة للأطفال') },
  { name: toLocalized('Adidas', 'أديداس'), slug: 'adidas', image: 'https://placehold.co/200x80/000000/FFFFFF?text=ADIDAS', description: toLocalized('Quality sportswear for active kids', 'ملابس رياضية للأطفال النشطين') },
  { name: toLocalized('Lego', 'ليغو'), slug: 'lego', image: 'https://placehold.co/200x80/FF0000/FFFFFF?text=LEGO', description: toLocalized('Creative building toys', 'ألعاب بناء إبداعية') },
  { name: toLocalized('Samsung', 'سامسونج'), slug: 'samsung', image: 'https://placehold.co/200x80/1428A0/FFFFFF?text=SAMSUNG', description: toLocalized('Kids tablets and gadgets', 'أجهزة لوحية وأجهزة للأطفال') },
  { name: toLocalized('Puma', 'بوما'), slug: 'puma', image: 'https://placehold.co/200x80/000000/FFFFFF?text=PUMA', description: toLocalized('Sporty and stylish kidswear', 'ملابس رياضية أنيقة للأطفال') },
  { name: toLocalized('Disney', 'ديزني'), slug: 'disney', image: 'https://placehold.co/200x80/FF9900/FFFFFF?text=DISNEY', description: toLocalized('Magical Disney characters', 'شخصيات ديزني السحرية') }
];

const colors = [
  { name: 'Red', family: 'Red', hexCode: '#FF0000' },
  { name: 'Blue', family: 'Blue', hexCode: '#0000FF' },
  { name: 'Green', family: 'Green', hexCode: '#00FF00' },
  { name: 'Yellow', family: 'Yellow', hexCode: '#FFFF00' },
  { name: 'Pink', family: 'Pink', hexCode: '#FFC0CB' },
  { name: 'Black', family: 'Black', hexCode: '#000000' },
  { name: 'White', family: 'White', hexCode: '#FFFFFF' },
  { name: 'Navy', family: 'Blue', hexCode: '#000080' },
  { name: 'Gray', family: 'Gray', hexCode: '#808080' },
  { name: 'Purple', family: 'Purple', hexCode: '#800080' }
];

const sizes = [
  { name: '2-3Y' }, { name: '3-4Y' }, { name: '4-5Y' }, { name: '5-6Y' }, { name: '6-7Y' },
  { name: '7-8Y' }, { name: '8-9Y' }, { name: '9-10Y' }, { name: '10-11Y' }, { name: '11-12Y' },
  { name: '12-13Y' }, { name: '13-14Y' }, { name: 'Newborn' }, { name: '0-3M' }, { name: '3-6M' },
  { name: '6-9M' }, { name: '9-12M' }, { name: '12-18M' }, { name: '18-24M' }
];

const productData = [
  // Kids Boys (5 products)
  { name: 'Nike Boys Tactical Shorts', basePrice: 599, brandIdx: 0, categoryIdx: 0, description: toLocalized('Comfortable tactical shorts for active boys', 'شورت تكتيكي مريح للأولاد النشطين'), isBestSeller: true },
  { name: 'Adidas Boys Performance T-Shirt', basePrice: 449, brandIdx: 1, categoryIdx: 0, description: toLocalized('Breathable sports t-shirt', 'تي شIRT رياضي قابل للتنفس'), isBestSeller: false },
  { name: 'Puma Boys Classic Hoodie', basePrice: 749, brandIdx: 4, categoryIdx: 0, description: toLocalized('Warm and stylish hoodie', 'هودي دافئ وأنيق'), isBestSeller: true },
  { name: 'Nike Boys Run Training Shoes', basePrice: 1299, brandIdx: 0, categoryIdx: 0, description: toLocalized('Lightweight running shoes', 'حذاء جري خفيف الوزن'), isBestSeller: false },
  { name: 'Adidas Boys Soccer Jersey', basePrice: 549, brandIdx: 1, categoryIdx: 0, description: toLocalized('Official style soccer jersey', 'قميص كرة قدم بأناقة رسمية'), isBestSeller: false },
  // Kids Girls (5 products)
  { name: 'Nike Girls Active Leggings', basePrice: 649, brandIdx: 0, categoryIdx: 1, description: toLocalized('Flexible leggings for active girls', 'ليgings مرنة للفتيات النشطات'), isBestSeller: true },
  { name: 'Adidas Girls Pretty Dress', basePrice: 899, brandIdx: 1, categoryIdx: 1, description: toLocalized('Elegant dress for special occasions', 'فستان أنيق للمناسبات الخاصة'), isBestSeller: false },
  { name: 'Disney Girls Frozen T-Shirt', basePrice: 399, brandIdx: 5, categoryIdx: 1, description: toLocalized('Frozen themed cotton t-shirt', 'تي شIRT قطني بموضوع فروزن'), isBestSeller: true },
  { name: 'Puma Girls Sport Top', basePrice: 449, brandIdx: 4, categoryIdx: 1, description: toLocalized('Comfortable sport top', 'سporto علوي مريح'), isBestSeller: false },
  { name: 'Nike Girls Dance Pants', basePrice: 599, brandIdx: 0, categoryIdx: 1, description: toLocalized('Stretchy dance pants', 'بناطيل رقص مرنة'), isBestSeller: false },
  // Kids Baby Boys (5 products)
  { name: 'Disney Baby Boys Mickey Bodysuit', basePrice: 299, brandIdx: 5, categoryIdx: 2, description: toLocalized('Soft cotton bodysuit with Mickey', 'bodysuit قطني ناعم مع ميكي'), isBestSeller: true },
  { name: 'Nike Baby Boys Cotton Set', basePrice: 449, brandIdx: 0, categoryIdx: 2, description: toLocalized('Comfortable 3-piece set', 'طقم قطني من 3 قطع'), isBestSeller: false },
  { name: 'Adidas Baby Boys Track Suit', basePrice: 699, brandIdx: 1, categoryIdx: 2, description: toLocalized('Warm track suit for winter', 'بدلة شتوية دافئة'), isBestSeller: false },
  { name: 'Puma Baby Boys Soft Romper', basePrice: 349, brandIdx: 4, categoryIdx: 2, description: toLocalized('Soft cotton romper', 'romper قطني ناعم'), isBestSeller: false },
  { name: 'Disney Baby Boys Marvel T-Shirt', basePrice: 279, brandIdx: 5, categoryIdx: 2, description: toLocalized('Marvel superhero tee', 'تي شIRT سوبر هيرو'), isBestSeller: true },
  // Kids Baby Girls (5 products)
  { name: 'Disney Baby Girls Princess Dress', basePrice: 499, brandIdx: 5, categoryIdx: 3, description: toLocalized('Beautiful princess dress', 'فستان أميرة جميل'), isBestSeller: true },
  { name: 'Nike Baby Girls Floral Set', basePrice: 399, brandIdx: 0, categoryIdx: 3, description: toLocalized('Cute floral pattern set', 'طقم بنمط زهري'), isBestSeller: false },
  { name: 'Adidas Baby Girls Velvet Dress', basePrice: 799, brandIdx: 1, categoryIdx: 3, description: toLocalized('Luxurious velvet dress', 'فستان مخملي فاخر'), isBestSeller: false },
  { name: 'Puma Baby Girls Cotton Romper', basePrice: 329, brandIdx: 4, categoryIdx: 3, description: toLocalized('Comfortable cotton romper', 'romper قطني مريح'), isBestSeller: false },
  { name: 'Disney Baby Girls Minnie Dress', basePrice: 449, brandIdx: 5, categoryIdx: 3, description: toLocalized('Cute Minnie Mouse dress', 'فستان ميني ماوس'), isBestSeller: true },
  // Kids Accessories (5 products)
  { name: 'Nike Kids Sports Cap', basePrice: 249, brandIdx: 0, categoryIdx: 4, description: toLocalized('Breathable sports cap', 'كاب رياضي قابل للتنفس'), isBestSeller: false },
  { name: 'Adidas Kids Backpack', basePrice: 549, brandIdx: 1, categoryIdx: 4, description: toLocalized('Durable school backpack', 'حقيبة مدرسية متينة'), isBestSeller: true },
  { name: 'Lego Kids Lunch Box', basePrice: 299, brandIdx: 2, categoryIdx: 4, description: toLocalized('Fun Lego lunch box', 'حاوية غداء ليغو'), isBestSeller: false },
  { name: 'Disney Kids Socks Pack', basePrice: 199, brandIdx: 5, categoryIdx: 4, description: toLocalized('3-pack Disney socks', '3 قطع جوارب ديزني'), isBestSeller: false },
  { name: 'Nike Kids Water Bottle', basePrice: 179, brandIdx: 0, categoryIdx: 4, description: toLocalized('Sports water bottle', 'زجاجة ماء رياضية'), isBestSeller: false },
  // Next Boys (5 products)
  { name: 'Nike Next Boys Pro Training Kit', basePrice: 1499, brandIdx: 0, categoryIdx: 5, description: toLocalized('Professional training gear', 'معدات تدريب احترافية'), isBestSeller: true },
  { name: 'Adidas Next Boys Tech Fleece', basePrice: 1199, brandIdx: 1, categoryIdx: 5, description: toLocalized('Premium tech fleece jacket', 'جاكيت فليس تقني'), isBestSeller: false },
  { name: 'Puma Next Boys Elite Shorts', basePrice: 899, brandIdx: 4, categoryIdx: 5, description: toLocalized('Premium athletic shorts', 'شورت رياضي متميز'), isBestSeller: false },
  { name: 'Nike Next Boys Running Jacket', basePrice: 1399, brandIdx: 0, categoryIdx: 5, description: toLocalized('Lightweight running jacket', 'جاكيت جري خفيف'), isBestSeller: true },
  { name: 'Adidas Next Boys Soccer Boots', basePrice: 1899, brandIdx: 1, categoryIdx: 5, description: toLocalized('Pro soccer cleats', 'حذاء كرة قدم'), isBestSeller: false },
  // Next Girls (5 products)
  { name: 'Nike Next Girls Yoga Set', basePrice: 1299, brandIdx: 0, categoryIdx: 6, description: toLocalized('Premium yoga outfit', 'طقم يوغا متميز'), isBestSeller: true },
  { name: 'Adidas Next Girls Sport Dress', basePrice: 999, brandIdx: 1, categoryIdx: 6, description: toLocalized('Elegant sport dress', 'فSPORT أنيق'), isBestSeller: false },
  { name: 'Puma Next Girls Performance Top', basePrice: 799, brandIdx: 4, categoryIdx: 6, description: toLocalized('High-performance top', 'أعلى أداء عالي'), isBestSeller: false },
  { name: 'Disney Next Girls Marvel Hoodie', basePrice: 899, brandIdx: 5, categoryIdx: 6, description: toLocalized('Marvel superhero hoodie', 'هودي سوبر هيرو'), isBestSeller: true },
  { name: 'Nike Next Girls Training Pants', basePrice: 1099, brandIdx: 0, categoryIdx: 6, description: toLocalized('Premium training pants', 'بناطيل تدريب مميزة'), isBestSeller: false },
  // Next Baby Boys (5 products)
  { name: 'Nike Next Baby Boys Premium Set', basePrice: 899, brandIdx: 0, categoryIdx: 7, description: toLocalized('Luxury cotton set', 'طقم قطن فاخر'), isBestSeller: true },
  { name: 'Adidas Next Baby Boys Winter Suit', basePrice: 1199, brandIdx: 1, categoryIdx: 7, description: toLocalized('Warm winter suit', 'بدلة شتوية دافئة'), isBestSeller: false },
  { name: 'Puma Next Baby Boys Bodysuit Pack', basePrice: 599, brandIdx: 4, categoryIdx: 7, description: toLocalized('3-pack bodysuits', '3 قطع bodysuits'), isBestSeller: false },
  { name: 'Disney Next Baby Boys Star Wars', basePrice: 799, brandIdx: 5, categoryIdx: 7, description: toLocalized('Star Wars themed set', 'طقم بموضوع حرب النجوم'), isBestSeller: true },
  { name: 'Nike Next Baby Boys Summer Set', basePrice: 649, brandIdx: 0, categoryIdx: 7, description: toLocalized('Lightweight summer set', 'طقم صيفي خفيف'), isBestSeller: false },
  // Next Baby Girls (5 products)
  { name: 'Nike Next Baby Girls Luxury Dress', basePrice: 1099, brandIdx: 0, categoryIdx: 8, description: toLocalized('Elegant luxury dress', 'فستان فاخر أنيق'), isBestSeller: true },
  { name: 'Adidas Next Baby Girls Tutu Set', basePrice: 899, brandIdx: 1, categoryIdx: 8, description: toLocalized('Cute tutu outfit', 'إطلالة توتو'), isBestSeller: false },
  { name: 'Disney Next Baby Girls Frozen Crown', basePrice: 749, brandIdx: 5, categoryIdx: 8, description: toLocalized('Frozen crown set', 'طقم تاج فروزن'), isBestSeller: true },
  { name: 'Puma Next Baby Girls Sporty Set', basePrice: 699, brandIdx: 4, categoryIdx: 8, description: toLocalized('Sporty casual set', 'طقم رياضي كاجوال'), isBestSeller: false },
  { name: 'Nike Next Baby Girls Floral Romper', basePrice: 599, brandIdx: 0, categoryIdx: 8, description: toLocalized('Cute floral romper', 'romper زهري جميل'), isBestSeller: false },
  // Next Accessories (5 products)
  { name: 'Samsung Kids Tablet Tab A', basePrice: 2499, brandIdx: 3, categoryIdx: 9, description: toLocalized('Kids-friendly tablet', 'جهاز لوحي آمن للأطفال'), isBestSeller: true },
  { name: 'Lego Next Kids Building Set', basePrice: 899, brandIdx: 2, categoryIdx: 9, description: toLocalized('Advanced building kit', 'kit بناء متقدم'), isBestSeller: false },
  { name: 'Nike Next Kids Sports Bag', basePrice: 699, brandIdx: 0, categoryIdx: 9, description: toLocalized('Large sports bag', 'حقيبة رياضية كبيرة'), isBestSeller: false },
  { name: 'Adidas Next Kids Gym Mat', basePrice: 449, brandIdx: 1, categoryIdx: 9, description: toLocalized('Exercise mat', 'سجادة رياضة'), isBestSeller: false },
  { name: 'Samsung Kids Smart Watch', basePrice: 999, brandIdx: 3, categoryIdx: 9, description: toLocalized('Kids GPS watch', 'ساعة定位 للأطفال'), isBestSeller: true }
];

const users = [
  { email: 'admin@kidsco.com', password: 'Admin@123', firstName: 'Ahmed', lastName: 'Salah', role: 'SYSTEM_ADMIN', phone: '+201000000001' },
  { email: 'kids.admin@kidsco.com', password: 'Kids@123', firstName: 'Sara', lastName: 'Mohamed', role: 'ADMIN_KIDS', phone: '+201000000002' },
  { email: 'next.admin@kidsco.com', password: 'Next@123', firstName: 'Omar', lastName: 'Ali', role: 'ADMIN_NEXT', phone: '+201000000003' },
  { email: 'seller@kidsco.com', password: 'Seller@123', firstName: 'Mariam', lastName: 'Hassan', role: 'SELLER', phone: '+201000000004' },
  { email: 'product.manager@kidsco.com', password: 'PM@123', firstName: 'Youssef', lastName: 'Ibrahim', role: 'SELLER', phone: '+201000000005' },
  { email: 'order.editor@kidsco.com', password: 'OE@123', firstName: 'Fatima', lastName: 'Ahmed', role: 'SELLER', phone: '+201000000006' },
  { email: 'customer1@test.com', password: 'Customer@123', firstName: 'Mohamed', lastName: 'Ali', role: 'CUSTOMER', phone: '+201000000007' },
  { email: 'customer2@test.com', password: 'Customer@123', firstName: 'Nour', lastName: 'Youssef', role: 'CUSTOMER', phone: '+201000000008' },
  { email: 'customer3@test.com', password: 'Customer@123', firstName: 'Layla', lastName: 'Omar', role: 'CUSTOMER', phone: '+201000000009' },
  { email: 'customer4@test.com', password: 'Customer@123', firstName: 'Tarek', lastName: 'Hassan', role: 'CUSTOMER', phone: '+201000000010' }
];

const offers = [
  { name: 'Summer Sale 25%', description: toLocalized('25% off on all summer items', 'خصم 25% على جميع العناصر الصيفية'), discountPercent: 25, type: 'CATEGORY', isActive: true, startDate: DAYS(-10), endDate: DAYS(50) },
  { name: 'Nike Free Shipping', description: toLocalized('Free shipping on Nike orders over 500 EGP', 'شحن مجاني على pedidos Nike فوق 500 جنيه'), discountAmount: 0, type: 'BRAND', isActive: true, startDate: DAYS(-5), endDate: DAYS(30) },
  { name: 'Buy 2 Get 1 Free - Adidas', description: toLocalized('Buy 2 Adidas items get 1 free', 'اشتر 2 واحصل على 1 مجاني'), discountPercent: 33, type: 'BRAND', isActive: true, startDate: DAYS(-7), endDate: DAYS(21) },
  { name: 'New Year Offer', description: toLocalized('15% off on all products', 'خصم 15% على جميع المنتجات'), discountPercent: 15, type: 'PRODUCT', isActive: true, startDate: DAYS(-30), endDate: DAYS(60) },
  { name: 'Kids Essentials', description: toLocalized('20% off on baby essentials', 'خصم 20% على اساسيات الأطفال'), discountPercent: 20, type: 'CATEGORY', isActive: true, startDate: DAYS(-15), endDate: DAYS(45) },
  { name: 'Lego Building Fun', description: toLocalized('10% off Lego sets', 'خصم 10% على مجموعات ليغو'), discountPercent: 10, type: 'BRAND', isActive: true, startDate: DAYS(-20), endDate: DAYS(40) },
  { name: 'Disney Magic Sale', description: toLocalized('30% off Disney items', 'خصم 30% على منتجات ديزني'), discountPercent: 30, type: 'BRAND', isActive: true, startDate: DAYS(-3), endDate: DAYS(27) },
  { name: 'Puma Sports Week', description: toLocalized('25% off Puma sportswear', 'خصم 25% على ملابس بوما الرياضية'), discountPercent: 25, type: 'BRAND', isActive: true, startDate: DAYS(-1), endDate: DAYS(14) },
  { name: 'Clearance Sale', description: toLocalized('Up to 50% off clearance items', 'حتى 50% خصم على المخالفات'), discountPercent: 50, type: 'PRODUCT', isActive: true, startDate: DAYS(-60), endDate: DAYS(-5) },
  { name: 'Samsung Kids Tech', description: toLocalized('Free case with Samsung tablet', 'حالة مجانية مع جهاز سامسونج'), discountAmount: 150, type: 'PRODUCT', isActive: true, startDate: DAYS(-8), endDate: DAYS(35) },
  { name: 'Accessories Bonanza', description: toLocalized('15% off on all accessories', 'خصم 15% على جميع الاكسسوارات'), discountPercent: 15, type: 'CATEGORY', isActive: true, startDate: DAYS(0), endDate: DAYS(30) },
  { name: 'Next Collection Launch', description: toLocalized('Free delivery on Next collection', 'توصيل مجاني على مجموعة next'), discountAmount: 0, type: 'CATEGORY', isActive: true, startDate: DAYS(-2), endDate: DAYS(20) }
];

async function seed() {
  console.log('🚀 Starting comprehensive seed...\n');

  // 1. Seed Colors
  console.log('🎨 Seeding Colors...');
  for (const color of colors) {
    await prisma.color.upsert({ where: { name: color.name }, update: color, create: color });
  }
  console.log(`   ✅ ${colors.length} colors seeded\n`);

  // 2. Seed Sizes
  console.log('📏 Seeding Sizes...');
  for (const size of sizes) {
    await prisma.size.upsert({ where: { name: size.name }, update: size, create: size });
  }
  console.log(`   ✅ ${sizes.length} sizes seeded\n`);

  // 3. Seed Brands
  console.log('🏷️ Seeding Brands...');
  const brandMap = {};
  for (let i = 0; i < brands.length; i++) {
    const brand = await prisma.brand.upsert({
      where: { slug: brands[i].slug },
      update: { ...brands[i], isActive: true },
      create: { ...brands[i], isActive: true }
    });
    brandMap[i] = brand.id;
  }
  console.log(`   ✅ ${brands.length} brands seeded\n`);

  // 4. Seed Categories
  console.log('📂 Seeding Categories...');
  const categoryMap = {};
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name_audience: { name: cat.name, audience: cat.audience } },
      update: { slug: cat.slug, isActive: true },
      create: { ...cat, isActive: true }
    });
    const key = `${cat.audience}-${cat.name}`;
    categoryMap[key] = category.id;
  }
  console.log(`   ✅ ${categories.length} categories seeded\n`);

  // 5. Seed Products with Variants
  console.log('📦 Seeding Products & Variants...');
  const productIds = [];
  const allColors = await prisma.color.findMany();
  const allSizes = await prisma.size.findMany();
  const kidsSizes = allSizes.slice(0, 8);
  const babySizes = allSizes.slice(12);

  for (let i = 0; i < productData.length; i++) {
    const p = productData[i];
    const categoryKey = `${p.categoryIdx < 5 ? 'KIDS' : 'NEXT'}-${categories[p.categoryIdx].name}`;
    const categoryId = categoryMap[categoryKey];
    const brandId = brandMap[p.brandIdx];
    const isBaby = p.categoryIdx >= 2 && p.categoryIdx <= 3 || p.categoryIdx >= 7 && p.categoryIdx <= 8;
    const productSizes = isBaby ? babySizes : kidsSizes;
    const productColors = allColors.slice(0, 4);

    const product = await prisma.product.upsert({
      where: { sku: `SKU-${i + 1}` },
      update: { name: p.name, description: p.description, basePrice: p.basePrice, isBestSeller: p.isBestSeller, isActive: true },
      create: {
        sku: `SKU-${i + 1}`,
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        isBestSeller: p.isBestSeller,
        isActive: true,
        audience: p.categoryIdx < 5 ? 'KIDS' : 'NEXT',
        categoryId,
        brandId
      }
    });
    productIds.push(product.id);

    // Create variants (2 colors x 2 sizes = 4 variants)
    for (const color of productColors.slice(0, 2)) {
      for (const size of productSizes.slice(0, 2)) {
        const variantPrice = p.basePrice + (Math.random() * 200 - 100);
        const stock = Math.floor(Math.random() * 50) + 5;
        await prisma.productVariant.upsert({
          where: { sku: `SKU-${i + 1}-${color.name}-${size.name}` },
          update: { price: Math.round(variantPrice), stock, lowStockThreshold: 5 },
          create: {
            sku: `SKU-${i + 1}-${color.name}-${size.name}`,
            price: Math.round(variantPrice),
            stock,
            lowStockThreshold: 5,
            productId: product.id,
            colorId: color.id,
            sizeId: size.id
          }
        });
      }
    }
  }
  console.log(`   ✅ ${productData.length} products with variants seeded\n`);

  // 6. Seed Users
  console.log('👥 Seeding Users...');
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { password: hashedPassword, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role },
      create: { email: user.email, password: hashedPassword, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role }
    });
  }
  console.log(`   ✅ ${users.length} users seeded\n`);

  // 7. Seed Offers
  console.log('🏷️ Seeding Offers...');
  const allCategories = await prisma.category.findMany();
  const allBrands = await prisma.brand.findMany();

  // Assign offers to different targets (using unique names)
  const offerData = [
    { ...offers[0], name: 'Summer Sale 25%', categoryId: categoryMap['KIDS-Accessories'] },
    { ...offers[1], name: 'Nike Free Shipping', brandId: brandMap[0] },
    { ...offers[2], name: 'Adidas Buy 2 Get 1', brandId: brandMap[1] },
    { ...offers[3], name: 'New Year Offer', productId: productIds[0] },
    { ...offers[4], name: 'Kids Essentials 20%', categoryId: categoryMap['KIDS-Baby Boys'] },
    { ...offers[5], name: 'Lego Building Fun 10%', brandId: brandMap[2] },
    { ...offers[6], name: 'Disney Magic 30%', brandId: brandMap[5] },
    { ...offers[7], name: 'Puma Sports Week 25%', brandId: brandMap[4] },
    { ...offers[8], name: 'Clearance Sale 50%', productId: productIds[15] },
    { ...offers[9], name: 'Samsung Kids Tech', productId: productIds[49] },
    { ...offers[10], name: 'Accessories Bonanza 15%', categoryId: categoryMap['NEXT-Accessories'] },
    { ...offers[11], name: 'Next Collection Launch', categoryId: categoryMap['NEXT-Boys'] }
  ];

  for (const offer of offerData) {
    const { name, description, discountPercent, discountAmount, type, isActive, startDate, endDate, productId, categoryId, brandId } = offer;
    await prisma.offer.upsert({
      where: { name },
      update: { description, discountPercent, discountAmount, type, isActive, startDate, endDate, productId, categoryId, brandId },
      create: { name, description, discountPercent, discountAmount, type, isActive, startDate, endDate, productId, categoryId, brandId }
    });
  }
  console.log(`   ✅ ${offerData.length} offers seeded\n`);

  console.log('✨ ========================================');
  console.log('🎉 ALL SEED DATA COMPLETED SUCCESSFULLY!');
  console.log('   📊 Summary:');
  console.log(`   - Categories: ${categories.length} (5 Kids + 5 Next)`);
  console.log(`   - Brands: ${brands.length}`);
  console.log(`   - Products: ${productData.length} (10 categories × 5 products)`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Offers: ${offerData.length}`);
  console.log('✨ ========================================\n');
}

seed()
  .catch(e => { console.error('❌ Seed Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());