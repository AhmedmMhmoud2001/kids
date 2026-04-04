const prisma = require('./config/db');

// Product templates for each category
const productTemplates = {
    'Boy': [
        { name: 'Boys Cotton T-Shirt', price: 15.99, description: 'Comfortable cotton t-shirt for boys' },
        { name: 'Boys Denim Jeans', price: 29.99, description: 'Durable denim jeans with adjustable waist' },
        { name: 'Boys Polo Shirt', price: 19.99, description: 'Classic polo shirt in multiple colors' },
        { name: 'Boys Cargo Shorts', price: 22.99, description: 'Practical cargo shorts with multiple pockets' },
        { name: 'Boys Hoodie', price: 34.99, description: 'Warm and cozy hoodie for cool days' },
        { name: 'Boys Track Pants', price: 24.99, description: 'Comfortable track pants for active boys' },
        { name: 'Boys Graphic Tee', price: 16.99, description: 'Fun graphic print t-shirt' },
        { name: 'Boys Chino Pants', price: 27.99, description: 'Smart casual chino pants' },
        { name: 'Boys Sweater', price: 32.99, description: 'Soft knit sweater for layering' },
        { name: 'Boys Button-Up Shirt', price: 25.99, description: 'Classic button-up shirt for formal occasions' }
    ],
    'Girl': [
        { name: 'Girls Floral Dress', price: 34.99, description: 'Beautiful floral print dress' },
        { name: 'Girls Denim Skirt', price: 24.99, description: 'Trendy denim skirt with pockets' },
        { name: 'Girls Leggings', price: 14.99, description: 'Comfortable stretch leggings' },
        { name: 'Girls Tutu Skirt', price: 19.99, description: 'Adorable tutu skirt for special occasions' },
        { name: 'Girls Cardigan', price: 28.99, description: 'Soft cardigan sweater' },
        { name: 'Girls T-Shirt Dress', price: 21.99, description: 'Casual t-shirt style dress' },
        { name: 'Girls Blouse', price: 22.99, description: 'Pretty blouse with bow detail' },
        { name: 'Girls Jumpsuit', price: 36.99, description: 'Stylish one-piece jumpsuit' },
        { name: 'Girls Shorts Set', price: 26.99, description: 'Matching top and shorts set' },
        { name: 'Girls Party Dress', price: 44.99, description: 'Elegant dress for parties' }
    ],
    'Baby Boy': [
        { name: 'Baby Boy Romper', price: 18.99, description: 'Cute romper for baby boys' },
        { name: 'Baby Boy Onesie Pack', price: 24.99, description: 'Set of 3 comfortable onesies' },
        { name: 'Baby Boy Sleepsuit', price: 16.99, description: 'Soft sleepsuit with feet' },
        { name: 'Baby Boy Dungarees', price: 22.99, description: 'Adorable denim dungarees' },
        { name: 'Baby Boy Bodysuit', price: 12.99, description: 'Essential cotton bodysuit' },
        { name: 'Baby Boy Jacket', price: 29.99, description: 'Warm jacket for outdoor adventures' },
        { name: 'Baby Boy Pants', price: 15.99, description: 'Soft elastic waist pants' },
        { name: 'Baby Boy Shirt', price: 14.99, description: 'Cute button-up shirt' },
        { name: 'Baby Boy Sweater', price: 21.99, description: 'Cozy knit sweater' },
        { name: 'Baby Boy Overall', price: 26.99, description: 'Comfortable overall with snaps' }
    ],
    'Baby Girl': [
        { name: 'Baby Girl Dress', price: 24.99, description: 'Sweet dress with bloomers' },
        { name: 'Baby Girl Onesie Pack', price: 24.99, description: 'Set of 3 adorable onesies' },
        { name: 'Baby Girl Sleepsuit', price: 16.99, description: 'Soft sleepsuit with feet' },
        { name: 'Baby Girl Romper', price: 19.99, description: 'Floral print romper' },
        { name: 'Baby Girl Bodysuit', price: 12.99, description: 'Essential cotton bodysuit' },
        { name: 'Baby Girl Tutu Set', price: 28.99, description: 'Cute tutu with matching top' },
        { name: 'Baby Girl Cardigan', price: 22.99, description: 'Soft cardigan sweater' },
        { name: 'Baby Girl Leggings', price: 13.99, description: 'Comfortable stretch leggings' },
        { name: 'Baby Girl Jacket', price: 29.99, description: 'Warm jacket with hood' },
        { name: 'Baby Girl Overall', price: 26.99, description: 'Denim overall dress' }
    ],
    'Accessories': [
        { name: 'Kids Backpack', price: 24.99, description: 'Durable backpack for school' },
        { name: 'Kids Baseball Cap', price: 12.99, description: 'Adjustable baseball cap' },
        { name: 'Kids Sunglasses', price: 9.99, description: 'UV protection sunglasses' },
        { name: 'Kids Belt', price: 11.99, description: 'Adjustable fabric belt' },
        { name: 'Kids Beanie Hat', price: 14.99, description: 'Warm knit beanie' },
        { name: 'Kids Scarf', price: 16.99, description: 'Soft winter scarf' },
        { name: 'Kids Gloves', price: 13.99, description: 'Warm winter gloves' },
        { name: 'Kids Hair Accessories', price: 8.99, description: 'Set of hair clips and bands' },
        { name: 'Kids Watch', price: 19.99, description: 'Colorful digital watch' },
        { name: 'Kids Socks Pack', price: 15.99, description: 'Pack of 5 fun socks' }
    ],
    'Footwear': [
        { name: 'Kids Sneakers', price: 34.99, description: 'Comfortable athletic sneakers' },
        { name: 'Kids Sandals', price: 24.99, description: 'Summer sandals with velcro straps' },
        { name: 'Kids Boots', price: 39.99, description: 'Waterproof boots for rainy days' },
        { name: 'Kids Slip-On Shoes', price: 28.99, description: 'Easy slip-on canvas shoes' },
        { name: 'Kids Rain Boots', price: 22.99, description: 'Colorful rain boots' },
        { name: 'Kids Dress Shoes', price: 32.99, description: 'Formal shoes for special occasions' },
        { name: 'Kids Slippers', price: 16.99, description: 'Cozy indoor slippers' },
        { name: 'Kids Running Shoes', price: 36.99, description: 'Lightweight running shoes' },
        { name: 'Kids Winter Boots', price: 44.99, description: 'Insulated winter boots' },
        { name: 'Kids Flip Flops', price: 12.99, description: 'Comfortable beach flip flops' }
    ]
};

const colors = ['Red', 'Blue', 'Green', 'Pink', 'Black', 'White', 'Yellow', 'Purple'];
const sizes = ['XS', 'S', 'M', 'L', 'XL'];
const imageColors = ['4F46E5', 'EC4899', '10B981', 'F59E0B', '8B5CF6', 'EF4444'];

function generateSKU(categoryName, index, audience) {
    const prefix = audience === 'KIDS' ? 'KD' : 'NX';
    const catCode = categoryName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    return `${prefix}-${catCode}-${String(index).padStart(4, '0')}`;
}

function generateProductImages(productName, count = 6) {
    const images = [];
    for (let i = 0; i < count; i++) {
        const color = imageColors[i % imageColors.length];
        const imageUrl = `https://placehold.co/600x600/${color}/FFFFFF?text=${encodeURIComponent(productName)}+${i + 1}`;
        images.push(imageUrl);
    }
    return images;
}

async function seedProducts() {
    console.log('🌱 Seeding Products for all Categories...\n');

    // Get all categories
    const categories = await prisma.category.findMany({
        orderBy: [
            { audience: 'asc' },
            { name: 'asc' }
        ]
    });

    let totalProducts = 0;

    for (const category of categories) {
        console.log(`📦 Adding products for ${category.name} (${category.audience}):`);

        const templates = productTemplates[category.name] || productTemplates['Boy'];

        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            const sku = generateSKU(category.name, totalProducts + i + 1, category.audience);
            const imageCount = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6 images
            const images = generateProductImages(template.name, imageCount);

            try {
                await prisma.product.create({
                    data: {
                        name: `${template.name} - ${category.audience}`,
                        description: template.description,
                        price: template.price,
                        sku: sku,
                        brand: category.audience === 'KIDS' ? 'Kids & Co' : 'Next Gen',
                        audience: category.audience,
                        categoryId: category.id,
                        stock: Math.floor(Math.random() * 100) + 20, // Random stock between 20-120
                        colors: JSON.stringify(colors.slice(0, 4)),
                        sizes: JSON.stringify(sizes.slice(0, 3)),
                        thumbnails: JSON.stringify(images),
                        additionalInfo: `High quality ${template.name.toLowerCase()} for ${category.audience.toLowerCase()} collection`,
                        isActive: true
                    }
                });
                console.log(`   ✅ ${template.name} (${sku}) - ${imageCount} images`);
            } catch (error) {
                console.error(`   ❌ Error adding ${template.name}:`, error.message);
            }
        }

        totalProducts += templates.length;
        console.log('');
    }

    console.log(`✨ Successfully seeded ${totalProducts} products across ${categories.length} categories!`);
}

seedProducts()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
