const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COLOR_FAMILY_MAP = {
    // Red
    'red': 'Red', 'dark red': 'Red', 'burgundy': 'Red', 'wine': 'Red', 'maroon': 'Red', 'rose': 'Red', 'salmon': 'Red', 'coral': 'Red', 'crimson': 'Red', 'scarlet': 'Red', 'ruby': 'Red',
    // Blue
    'blue': 'Blue', 'navy': 'Blue', 'sky': 'Blue', 'royal': 'Blue', 'azure': 'Blue', 'cyan': 'Blue', 'teal': 'Blue', 'turquoise': 'Blue', 'indigo': 'Blue', 'denim': 'Blue', 'aqua': 'Blue', 'petrol': 'Blue', 'sky blue': 'Blue', 'navy blue': 'Blue', 'light blue': 'Blue',
    // Green
    'green': 'Green', 'olive': 'Green', 'mint': 'Green', 'dark green': 'Green', 'lime': 'Green', 'emerald': 'Green', 'forest': 'Green', 'sage': 'Green', 'olive green': 'Green', 'khaki': 'Green',
    // Purple
    'purple': 'Purple', 'violet': 'Purple', 'plum': 'Purple', 'lavender': 'Purple', 'lilac': 'Purple', 'fuchsia': 'Purple', 'magenta': 'Purple', 'mauve': 'Purple',
    // Yellow
    'yellow': 'Yellow', 'gold': 'Yellow', 'mustard': 'Yellow', 'amber': 'Yellow', 'cream': 'Yellow', 'lemon': 'Yellow', 'ivory': 'Yellow', 'beige': 'Yellow', 'offwhite': 'Yellow', 'vanilla': 'Yellow', 'yellowish': 'Yellow',
    // Orange
    'orange': 'Orange', 'tangerine': 'Orange', 'rust': 'Orange', 'terracotta': 'Orange', 'peach': 'Orange', 'apricot': 'Orange',
    // Brown
    'brown': 'Brown', 'chocolate': 'Brown', 'coffee': 'Brown', 'camel': 'Brown', 'tan': 'Brown', 'chocolate brown': 'Brown', 'coffee brown': 'Brown',
    // Black
    'black': 'Black', 'charcoal': 'Black', 'graphite': 'Black', 'slate': 'Black', 'ebony': 'Black',
    // White
    'white': 'White', 'snow': 'White', 'pearl': 'White', 'milk': 'White', 'pure white': 'White',
    // Gray
    'gray': 'Gray', 'grey': 'Gray', 'silver': 'Gray', 'ash': 'Gray', 'platinum': 'Gray',
    // Multi
    'multi': 'Multi', 'rainbow': 'Multi', 'printed': 'Multi', 'colorful': 'Multi', 'mixed': 'Multi', 'multicolor': 'Multi'
};

const getColorFamily = (name) => {
    if (!name) return 'Other';
    const lowerName = String(name).toLowerCase().trim();
    if (COLOR_FAMILY_MAP[lowerName]) return COLOR_FAMILY_MAP[lowerName];
    const families = ['Red', 'Blue', 'Green', 'Purple', 'Yellow', 'Orange', 'Brown', 'Black', 'White', 'Gray', 'Multi'];
    for (const f of families) {
        if (lowerName.includes(f.toLowerCase())) return f;
    }
    return 'Other';
};

async function main() {
    const colors = await prisma.color.findMany();
    console.log(`Found ${colors.length} colors to process...`);

    for (const color of colors) {
        const family = getColorFamily(color.name);
        await prisma.color.update({
            where: { id: color.id },
            data: { family }
        });
        console.log(`Updated color "${color.name}" to family "${family}"`);
    }

    console.log('Done!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
