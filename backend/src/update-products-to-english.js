/**
 * Update existing products and colors in the database to English.
 * Run: node src/update-products-to-english.js
 */
require('dotenv').config();
const prisma = require('./config/db');

// Arabic color name -> English (matches frontend color list)
const COLOR_AR_TO_EN = {
  أحمر: 'Red',
  أزرق: 'Blue',
  أخضر: 'Green',
  وردي: 'Pink',
  أسود: 'Black',
  أبيض: 'White',
  أصفر: 'Yellow',
  برتقالي: 'Orange',
  رمادي: 'Gray',
  بني: 'Brown',
  بنفسجي: 'Purple',
  سماوي: 'Sky',
  كحلي: 'Navy',
  'أزرق غامق': 'Navy',
  بيج: 'Beige',
  كريم: 'Cream',
  ذهبي: 'Gold',
  فضي: 'Silver',
  عنابي: 'Burgundy',
  تركواز: 'Turquoise',
  فيروزي: 'Turquoise',
  سنتر: 'Cyan',
  مرجاني: 'Coral',
  نعناعي: 'Mint',
  خزامى: 'Lavender',
  زيتوني: 'Olive',
  خردلي: 'Mustard',
  خوخي: 'Peach',
  فحمي: 'Charcoal',
  'وردي غامق': 'Rose',
  سلمون: 'Salmon',
  ماجنتا: 'Magenta',
  نيلي: 'Indigo',
  زمردي: 'Emerald',
  كستنائي: 'Maroon',
  إسمنتي: 'Slate',
  جرافيت: 'Graphite',
  عناب: 'Wine',
  برقوقي: 'Plum',
  فوشيا: 'Fuchsia',
  أرجواني: 'Lilac',
  موف: 'Mauve',
  ديمن: 'Denim',
  أكوا: 'Aqua',
  بترول: 'Petrol',
  فولاذي: 'Steel',
  رماد: 'Ash',
  كاكي: 'Khaki',
  تان: 'Tan',
  جمل: 'Camel',
  شوكولاتة: 'Chocolate',
  قهوة: 'Coffee',
  عسل: 'Honey',
  زبدة: 'Butter',
  فانيليا: 'Vanilla',
  لبن: 'Milk',
  لؤلؤي: 'Pearl',
  عاجي: 'Ivory',
  ثلجي: 'Snow',
  'أوف وايت': 'Offwhite',
  أوفوايت: 'Offwhite',
  'بنفسجي فاتح': 'Violet',
  ليموني: 'Lime',
  تانجرين: 'Tangerine',
  صدئ: 'Rust',
  تيراكوتا: 'Terracotta',
  رمل: 'Sand',
  'خضراء زيتون': 'Olive green',
  'زيتوني أخضر': 'Olive green',
  حكيم: 'Sage',
  غابة: 'Forest',
  كهرمان: 'Amber',
  تيل: 'Teal',
};

const PRODUCT_NAME_AR_TO_EN = {
  'تيشيرت قطن أولاد': 'Boys Cotton T-Shirt',
  'جينز أولاد': 'Boys Denim Jeans',
  'بولو أولاد': 'Boys Polo Shirt',
  'شورتات أولاد': 'Boys Cargo Shorts',
  'هودي أولاد': 'Boys Hoodie',
  'بنطلون رياضي أولاد': 'Boys Track Pants',
  'تيشيرت رسوم أولاد': 'Boys Graphic Tee',
  'بنطلون شينو أولاد': 'Boys Chino Pants',
  'سويتر أولاد': 'Boys Sweater',
  'قميص أزرار أولاد': 'Boys Button-Up Shirt',
  'فستان زهري بنات': 'Girls Floral Dress',
  'تنورة جينز بنات': 'Girls Denim Skirt',
  'ليجنز بنات': 'Girls Leggings',
  'تنورة توتو بنات': 'Girls Tutu Skirt',
  'كارديجان بنات': 'Girls Cardigan',
  'فستان تيشيرت بنات': 'Girls T-Shirt Dress',
  'بلوزة بنات': 'Girls Blouse',
  'جمبسوت بنات': 'Girls Jumpsuit',
  'ست قصير بنات': 'Girls Shorts Set',
  'فستان سهرة بنات': 'Girls Party Dress',
  'رومبر ولد رضيع': 'Baby Boy Romper',
  'باكيت بادي ولد رضيع': 'Baby Boy Onesie Pack',
  'بيجاما ولد رضيع': 'Baby Boy Sleepsuit',
  'سالوبيت ولد رضيع': 'Baby Boy Dungarees',
  'بادي ولد رضيع': 'Baby Boy Bodysuit',
  'جاكيت ولد رضيع': 'Baby Boy Jacket',
  'بنطلون ولد رضيع': 'Baby Boy Pants',
  'قميص ولد رضيع': 'Baby Boy Shirt',
  'سويتر ولد رضيع': 'Baby Boy Sweater',
  'أوفرول ولد رضيع': 'Baby Boy Overall',
  'فستان بنت رضيعة': 'Baby Girl Dress',
  'باكيت بادي بنت رضيعة': 'Baby Girl Onesie Pack',
  'بيجاما بنت رضيعة': 'Baby Girl Sleepsuit',
  'رومبر بنت رضيعة': 'Baby Girl Romper',
  'بادي بنت رضيعة': 'Baby Girl Bodysuit',
  'ست توتو بنت رضيعة': 'Baby Girl Tutu Set',
  'كارديجان بنت رضيعة': 'Baby Girl Cardigan',
  'ليجنز بنت رضيعة': 'Baby Girl Leggings',
  'جاكيت بنت رضيعة': 'Baby Girl Jacket',
  'أوفرول بنت رضيعة': 'Baby Girl Overall',
  'حقيبة ظهر أطفال': 'Kids Backpack',
  'كاب بيسبول أطفال': 'Kids Baseball Cap',
  'نظارات شمس أطفال': 'Kids Sunglasses',
  'حزام أطفال': 'Kids Belt',
  'بيريه أطفال': 'Kids Beanie Hat',
  'وشاح أطفال': 'Kids Scarf',
  'قفازات أطفال': 'Kids Gloves',
  'إكسسوارات شعر أطفال': 'Kids Hair Accessories',
  'ساعة أطفال': 'Kids Watch',
  'باكيت جوارب أطفال': 'Kids Socks Pack',
  'سنيكرز أطفال': 'Kids Sneakers',
  'صنادل أطفال': 'Kids Sandals',
  'بوت أطفال': 'Kids Boots',
  'سليب أون أطفال': 'Kids Slip-On Shoes',
  'بوت مطر أطفال': 'Kids Rain Boots',
  'حذاء رسمي أطفال': 'Kids Dress Shoes',
  'نعال أطفال': 'Kids Slippers',
  'حذاء رياضي أطفال': 'Kids Running Shoes',
  'بوت شتوي أطفال': 'Kids Winter Boots',
  'شبشب أطفال': 'Kids Flip Flops',
};

// Match Arabic script (for detecting any Arabic color name)
const ARABIC_REGEX = /[\u0600-\u06FF]/;

async function updateColors() {
  let updated = 0;
  const allColors = await prisma.color.findMany();
  const enNames = new Set(Object.values(COLOR_AR_TO_EN));

  for (const color of allColors) {
    const arName = color.name.trim();
    const enName = COLOR_AR_TO_EN[arName] || COLOR_AR_TO_EN[color.name];
    if (!enName) {
      if (ARABIC_REGEX.test(arName)) {
        console.log(`  [skip] No English mapping for: "${color.name}" (id ${color.id})`);
      }
      continue;
    }
    const existingEn = await prisma.color.findFirst({ where: { name: enName } });
    if (existingEn && existingEn.id !== color.id) {
      // English color already exists: reassign variants and colorImages to it, then delete this one
      await prisma.productVariant.updateMany({ where: { colorId: color.id }, data: { colorId: existingEn.id } });
      await prisma.productColorImage.updateMany({ where: { colorId: color.id }, data: { colorId: existingEn.id } });
      await prisma.color.delete({ where: { id: color.id } });
      console.log(`  Color: "${arName}" -> "${enName}" (merged into id ${existingEn.id}, deleted id ${color.id})`);
    } else if (existingEn && existingEn.id === color.id) {
      // Same record already has English name
      if (arName !== enName) {
        await prisma.color.update({ where: { id: color.id }, data: { name: enName } });
        console.log(`  Color: "${arName}" -> "${enName}"`);
        updated++;
      }
    } else {
      await prisma.color.update({ where: { id: color.id }, data: { name: enName } });
      console.log(`  Color: "${arName}" -> "${enName}"`);
      updated++;
    }
  }
  return updated;
}

async function updateProducts() {
  const products = await prisma.product.findMany({
    include: { category: true },
  });
  let updated = 0;
  for (const p of products) {
    let newName = null;
    if (PRODUCT_NAME_AR_TO_EN[p.name]) {
      newName = PRODUCT_NAME_AR_TO_EN[p.name];
    } else if (p.name.startsWith('Next ')) {
      const afterNext = p.name.slice(5).trim();
      if (PRODUCT_NAME_AR_TO_EN[afterNext]) {
        newName = 'Next ' + PRODUCT_NAME_AR_TO_EN[afterNext];
      }
    }
    const isDescAr = typeof p.description === 'string' && (p.description.includes('منتج') || p.description.includes('مريح'));
    const descEn = p.category
      ? (p.audience === 'NEXT'
        ? `Next – High quality ${p.category.name} product. Comfortable and stylish.`
        : `High quality product from ${p.category.name}. Comfortable and stylish.`)
      : p.description;
    const updates = {};
    if (newName && p.name !== newName) {
      updates.name = newName;
    }
    if (isDescAr && p.category) {
      updates.description = descEn;
    }
    if (Object.keys(updates).length > 0) {
      await prisma.product.update({
        where: { id: p.id },
        data: updates,
      });
      if (updates.name) console.log(`  Product #${p.id}: ${p.name} -> ${updates.name}`);
      if (updates.description) console.log(`  Product #${p.id}: description -> English`);
      updated++;
    }
  }
  return updated;
}

async function main() {
  console.log('Updating colors to English...\n');
  const colorsUpdated = await updateColors();
  console.log(`\nColors updated: ${colorsUpdated}\n`);

  console.log('Updating products to English...\n');
  const productsUpdated = await updateProducts();
  console.log(`\nProducts updated: ${productsUpdated}\n`);

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
