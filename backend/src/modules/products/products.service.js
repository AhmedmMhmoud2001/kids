const prisma = require('../../config/db');
const AppError = require('../../utils/AppError');
const XLSX = require('xlsx');
const { deleteFileFromUrl } = require('../../utils/fileUtils');
const { normalizeImageUrl } = require('../../utils/url');

const normalizeProduct = (product) => {
    if (!product) return product;

    // Fix category image
    if (product.category) {
        product.category.image = normalizeImageUrl(product.category.image);
    }

    // Fix brand image
    if (product.brandRel) {
        product.brandRel.image = normalizeImageUrl(product.brandRel.image);
    }

    // Fix colorImages
    if (product.colorImages) {
        product.colorImages = product.colorImages.map(ci => ({
            ...ci,
            imageUrl: normalizeImageUrl(ci.imageUrl)
        }));
    }

    // Fix legacy image field if exists
    if (product.image) {
        product.image = normalizeImageUrl(product.image);
    }

    return product;
};

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

// Helpers: get or create Color/Size by name (for variants)
const getOrCreateColor = async (name) => {
    if (!name || typeof name !== 'string') return null;
    const trimmedName = name.trim();
    const family = getColorFamily(trimmedName);

    let c = await prisma.color.findFirst({ where: { name: trimmedName } });

    if (!c) {
        c = await prisma.color.create({
            data: {
                name: trimmedName,
                family: family
            }
        });
    } else if (!c.family) {
        // Update existing colors that don't have a family yet
        c = await prisma.color.update({
            where: { id: c.id },
            data: { family: family }
        });
    }
    return c.id;
};
const getOrCreateSize = async (name) => {
    if (!name || typeof name !== 'string') return null;
    let s = await prisma.size.findFirst({ where: { name: String(name).trim() } });
    if (!s) s = await prisma.size.create({ data: { name: String(name).trim() } });
    return s.id;
};

// Create Product (basePrice optional; variants = price/stock/sku per color+size; colorImages = up to 8 per color)
exports.create = async (data) => {
    const { variants: variantsInput, colorImages: colorImagesInput, sku, ...rest } = data;
    const basePrice = data.basePrice != null && data.basePrice !== '' ? Number(data.basePrice) : null;
    const productData = {
        ...rest,
        ...(rest.image !== undefined ? { image: normalizeImageUrl(rest.image) } : {}),
        sku: sku ? String(sku).trim() : null,
        basePrice
    };
    let product;
    try {
        product = await prisma.product.create({
            data: productData,
            include: { category: true, brandRel: true }
        });
    } catch (err) {
        if (err.code === 'P2002' && err.meta?.target?.includes('sku')) {
            throw AppError.conflict(`Product SKU "${sku}" is already used. Use a unique SKU for each product.`);
        }
        throw err;
    }
    if (variantsInput && Array.isArray(variantsInput)) {
        for (const v of variantsInput) {
            const colorId = v.colorId || (v.colorName ? await getOrCreateColor(v.colorName) : null);
            const sizeId = v.sizeId || (v.sizeName ? await getOrCreateSize(v.sizeName) : null);
            if (colorId && sizeId && v.sku) {
                const sku = String(v.sku).trim();
                const lowStockThreshold = v.lowStockThreshold != null && v.lowStockThreshold !== '' ? Math.max(0, parseInt(v.lowStockThreshold, 10)) : null;
                try {
                    await prisma.productVariant.create({
                        data: {
                            productId: product.id,
                            colorId,
                            sizeId,
                            price: v.price != null && v.price !== '' ? Number(v.price) : 0,
                            stock: Math.max(0, parseInt(v.stock, 10) || 0),
                            lowStockThreshold,
                            sku,
                            available: v.available !== undefined && v.available !== '' ? /^(1|true|yes)$/i.test(String(v.available)) : true,
                            externalSku: v.externalSku ? String(v.externalSku).trim() : null,
                            externalColor: v.externalColor ? String(v.externalColor).trim() : null,
                            externalSize: v.externalSize ? String(v.externalSize).trim() : null
                        }
                    });
                } catch (err) {
                    if (err.code === 'P2002') {
                        const target = err.meta?.target;
                        if (Array.isArray(target) && target.includes('sku')) {
                            throw AppError.conflict(`SKU "${sku}" is already used. Use a unique SKU for each variant.`);
                        }
                        throw AppError.conflict('A variant with this color and size already exists for this product.');
                    }
                    throw err;
                }
            }
        }
    }
    if (colorImagesInput && Array.isArray(colorImagesInput)) {
        for (const ci of colorImagesInput) {
            const colorId = ci.colorId || (ci.colorName ? await getOrCreateColor(ci.colorName) : null);
            if (!colorId || !Array.isArray(ci.images)) continue;
            const urls = ci.images.slice(0, 8).map(normalizeImageUrl);
            for (let order = 1; order <= urls.length; order++) {
                await prisma.productColorImage.create({
                    data: { productId: product.id, colorId, imageUrl: urls[order - 1], order }
                });
            }
        }
    }
    const includeBase = { category: true, brandRel: true };
    const includeFull = { ...includeBase, variants: { include: { color: true, size: true } }, colorImages: { include: { color: true } } };
    try {
        return await prisma.product.findUnique({
            where: { id: product.id },
            include: includeFull
        });
    } catch (err) {
        if (err.message && (err.message.includes('variants') || err.message.includes('colorImages'))) {
            return prisma.product.findUnique({ where: { id: product.id }, include: includeBase });
        }
        throw err;
    }
};

// Build where clause from filter
const buildWhereClause = (filter = {}) => {
    const {
        categorySlug,
        minPrice,
        maxPrice,
        brands,
        colors,
        search,
        audience,
        isBestSeller,
        includeInactive, // when true (e.g. admin dashboard) show active + inactive
        ...otherFilters
    } = filter;

    const where = {
        ...(includeInactive ? {} : { isActive: true }),
        ...otherFilters
    };

    if (audience) {
        where.audience = audience;
    }

    if (isBestSeller !== undefined) {
        where.isBestSeller = isBestSeller;
    }

    // Search query
    if (search) {
        where.AND = [
            {
                OR: [
                    { name: { contains: search } },
                    { description: { contains: search } },
                    { sku: { contains: search } },
                    { brandRel: { name: { contains: search } } },
                    { brandRel: { slug: { contains: search } } }
                ]
            }
        ];
    }

    // Price range (basePrice; legacy price kept on model for migration)
    if (minPrice !== undefined || maxPrice !== undefined) {
        where.basePrice = {};
        if (minPrice !== undefined) where.basePrice.gte = minPrice;
        if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    // Brands (by relation)
    if (brands && brands.length > 0) {
        where.brandRel = { slug: { in: brands } };
    }

    // Category slug
    if (categorySlug) {
        where.category = { slug: categorySlug };
    }

    // Colors (via variants)
    if (colors && colors.length > 0) {
        where.variants = {
            some: {
                color: {
                    OR: [
                        { name: { in: colors } },
                        { family: { in: colors } }
                    ]
                }
            }
        };
    }

    return where;
};

// Get sorting options (by basePrice)
const getSortOptions = (sortBy) => {
    switch (sortBy) {
        case 'price-low': return { basePrice: 'asc' };
        case 'price-high': return { basePrice: 'desc' };
        case 'newness': return { createdAt: 'desc' };
        case 'popularity': return { favorites: { _count: 'desc' } };
        default: return { createdAt: 'desc' };
    }
};

// Find All (With optional scope filter) - Original method for backwards compatibility
exports.findAll = async (filter = {}) => {
    const where = buildWhereClause(filter);
    const orderBy = getSortOptions(filter.sortBy);

    const includeBase = { category: true, _count: { select: { favorites: true } } };
    const includeFull = { ...includeBase, variants: { include: { color: true, size: true } }, colorImages: { include: { color: true }, orderBy: { order: 'asc' } } };
    try {
        const products = await prisma.product.findMany({ where, include: includeFull, orderBy });
        return products.map(normalizeProduct);
    } catch (err) {
        if (err.message && (err.message.includes('variants') || err.message.includes('colorImages'))) {
            const products = await prisma.product.findMany({ where, include: includeBase, orderBy });
            return products.map(normalizeProduct);
        }
        throw err;
    }
};

// Find All with Pagination (include variants + colorImages when Prisma client has them)
const includeForList = { category: true, brandRel: true, _count: { select: { favorites: true } } };
const includeForListWithVariants = { ...includeForList, variants: { include: { color: true, size: true } } };
const includeForListFull = { ...includeForListWithVariants, colorImages: { include: { color: true }, orderBy: { order: 'asc' } } };

exports.findAllPaginated = async (filter = {}, pagination = {}) => {
    const where = buildWhereClause(filter);
    const orderBy = getSortOptions(filter.sortBy);
    const { skip = 0, limit = 50 } = pagination;

    let products, total, activeCount, inactiveCount, totalValue;

    try {
        const [p, t, active, inactive, value] = await Promise.all([
            prisma.product.findMany({
                where,
                include: includeForListFull,
                orderBy,
                skip,
                take: limit
            }),
            prisma.product.count({ where }),
            prisma.product.count({ where: { ...where, isActive: true } }),
            prisma.product.count({ where: { ...where, isActive: false } }),
            prisma.product.aggregate({
                where,
                _sum: {
                    basePrice: true
                }
            })
        ]);
        products = p;
        total = t;
        activeCount = active;
        inactiveCount = inactive;
        totalValue = value._sum.basePrice || 0;

    } catch (err) {
        // Fallback for limited schemas or errors
        if (err.message && (err.message.includes('variants') || err.message.includes('colorImages'))) {
            const [p, t] = await Promise.all([
                prisma.product.findMany({
                    where,
                    include: includeForList,
                    orderBy,
                    skip,
                    take: limit
                }),
                prisma.product.count({ where })
            ]);
            products = p;
            total = t;
            activeCount = total; // fallback approximate
            inactiveCount = 0;
            totalValue = 0;
        } else {
            throw err;
        }
    }
    return { 
        products: products.map(normalizeProduct), 
        total, 
        stats: { active: activeCount, inactive: inactiveCount, totalValue } 
    };
};

// Find One (with variants + colorImages)
exports.findOne = async (id) => {
    const includeBase = { category: true, brandRel: true };
    const includeFull = { ...includeBase, variants: { include: { color: true, size: true } }, colorImages: { include: { color: true }, orderBy: { order: 'asc' } } };
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: includeFull
        });
        return normalizeProduct(product);
    } catch (err) {
        if (err.message && (err.message.includes('variants') || err.message.includes('colorImages'))) {
            const product = await prisma.product.findUnique({
                where: { id },
                include: includeBase
            });
            return normalizeProduct(product);
        }
        throw err;
    }
};

// Update (basePrice, variants, colorImages)
exports.update = async (id, data) => {
    const productId = id;
    const { variants: variantsInput, colorImages: colorImagesInput, ...rest } = data;

    const updateData = {
        name: rest.name,
        sku: rest.sku ? String(rest.sku).trim() : undefined,
        description: rest.description,
        ...(rest.image !== undefined ? { image: normalizeImageUrl(rest.image) } : {}),
        isActive: rest.isActive,
        isBestSeller: rest.isBestSeller,
        audience: rest.audience,
        categoryId: rest.categoryId != null && rest.categoryId !== '' ? String(rest.categoryId) : undefined,
        brandId: rest.brandId != null && rest.brandId !== '' ? String(rest.brandId) : null
    };
    if (data.basePrice != null && data.basePrice !== '') updateData.basePrice = Number(data.basePrice);
    // next.co.uk source fields (optional, NEXT audience). Empty string clears the field; `undefined` leaves it alone.
    if (rest.sourceUrl !== undefined) updateData.sourceUrl = rest.sourceUrl === '' ? null : String(rest.sourceUrl).trim();
    if (rest.externalSku !== undefined) updateData.externalSku = rest.externalSku === '' ? null : String(rest.externalSku).trim();

    const includeBase = { category: true, brandRel: true };
    const includeFull = { ...includeBase, variants: { include: { color: true, size: true } }, colorImages: { include: { color: true } } };
    let product;
    try {
        product = await prisma.product.update({
            where: { id: productId },
            data: updateData,
            include: includeFull
        });
    } catch (err) {
        if (err.code === 'P2002' && err.meta?.target?.includes('sku')) {
            throw AppError.conflict(`Product SKU "${rest.sku}" is already used. Use a unique SKU for each product.`);
        }
        if (err.message && (err.message.includes('variants') || err.message.includes('colorImages'))) {
            product = await prisma.product.update({
                where: { id: productId },
                data: updateData,
                include: includeBase
            });
        } else {
            throw err;
        }
    }

    if (variantsInput && Array.isArray(variantsInput) && typeof prisma.productVariant !== 'undefined') {
        const existing = await prisma.productVariant.findMany({ where: { productId } });
        const existingMap = new Map(existing.map(e => [e.id, e]));
        const incomingIds = new Set(variantsInput.filter(v => v.id).map(v => v.id));
        for (const e of existing) {
            if (!incomingIds.has(e.id)) await prisma.productVariant.delete({ where: { id: e.id } });
        }
        const baseSku = `PRD-${productId}-${Date.now()}`;
        for (let idx = 0; idx < variantsInput.length; idx++) {
            const v = variantsInput[idx];
            let colorId = v.colorId || (v.colorName && String(v.colorName).trim() ? await getOrCreateColor(v.colorName) : null);
            let sizeId = v.sizeId || (v.sizeName && String(v.sizeName).trim() ? await getOrCreateSize(v.sizeName) : null);
            let sku = (v.sku != null && String(v.sku).trim() !== '') ? String(v.sku).trim() : null;

            if (v.id && existingMap.has(v.id)) {
                const existingVariant = existingMap.get(v.id);
                if (!colorId) colorId = existingVariant.colorId;
                if (!sizeId) sizeId = existingVariant.sizeId;
                if (!sku) sku = existingVariant.sku;
            }
            if (!colorId || !sizeId || !sku) continue;

            const price = v.price != null && v.price !== '' ? Number(v.price) : 0;
            const stock = Math.max(0, parseInt(v.stock, 10) || 0);
            const lowStockThreshold = v.lowStockThreshold != null && v.lowStockThreshold !== '' ? Math.max(0, parseInt(v.lowStockThreshold, 10)) : null;
            const available = v.available !== undefined && v.available !== '' ? /^(1|true|yes)$/i.test(String(v.available)) : true;
            // next.co.uk external fields (optional). Only included in the update when provided.
            const externalPatch = {};
            if (v.externalSku !== undefined) externalPatch.externalSku = v.externalSku === '' ? null : String(v.externalSku).trim();
            if (v.externalColor !== undefined) externalPatch.externalColor = v.externalColor === '' ? null : String(v.externalColor).trim();
            if (v.externalSize !== undefined) externalPatch.externalSize = v.externalSize === '' ? null : String(v.externalSize).trim();

            try {
                if (v.id && existingMap.has(v.id)) {
                    await prisma.productVariant.update({
                        where: { id: v.id },
                        data: { colorId, sizeId, price, stock, lowStockThreshold, sku, available, ...externalPatch }
                    });
                } else {
                    const newSku = sku || `${baseSku}-${idx + 1}`;
                    await prisma.productVariant.create({
                        data: { productId, colorId, sizeId, price, stock, lowStockThreshold, sku: newSku, ...externalPatch }
                    });
                }
            } catch (err) {
                if (err.code === 'P2002') {
                    const target = err.meta?.target;
                    if (Array.isArray(target) && target.includes('sku')) {
                        throw AppError.conflict(`SKU "${sku}" is already used. Use a unique SKU for each variant.`);
                    }
                    throw AppError.conflict('A variant with this color and size already exists for this product.');
                }
                throw err;
            }
        }
    }

    if (colorImagesInput && Array.isArray(colorImagesInput)) {
        // Get all new image URLs to avoid deleting ones that are still in use
        const newUrls = colorImagesInput
            .flatMap(ci => ci.images || [])
            .filter(Boolean)
            .map(normalizeImageUrl);

        // Cleanup old files ONLY if they are not in the new list
        const oldImages = await prisma.productColorImage.findMany({ where: { productId } });
        for (const img of oldImages) {
            if (!newUrls.includes(img.imageUrl)) {
                await deleteFileFromUrl(img.imageUrl);
            }
        }

        await prisma.productColorImage.deleteMany({ where: { productId } });
        for (const ci of colorImagesInput) {
            const colorId = ci.colorId || (ci.colorName ? await getOrCreateColor(ci.colorName) : null);
            if (!colorId || !Array.isArray(ci.images)) continue;
            const urls = ci.images.slice(0, 8).map(normalizeImageUrl);
            for (let order = 1; order <= urls.length; order++) {
                await prisma.productColorImage.create({
                    data: { productId, colorId, imageUrl: urls[order - 1], order }
                });
            }
        }
    }

    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: includeFull
        });
        return normalizeProduct(product);
    } catch (err) {
        if (err.message && (err.message.includes('variants') || err.message.includes('colorImages'))) {
            const product = await prisma.product.findUnique({ where: { id: productId }, include: includeBase });
            return normalizeProduct(product);
        }
        throw err;
    }
};

// Get Unique Color Families — for clean filtering on storefront
exports.getUniqueColors = async () => {
    const families = await prisma.color.findMany({
        where: { family: { not: null }, productVariants: { some: {} } },
        distinct: ['family'],
        select: { family: true },
        orderBy: { family: 'asc' }
    });
    return families.map(f => f.family);
};

// Get all specific color names (for admin or search suggestions)
exports.getUniqueColorNames = async () => {
    const colors = await prisma.color.findMany({
        where: { productVariants: { some: {} } },
        orderBy: { name: 'asc' },
        select: { name: true }
    });
    return colors.map(c => c.name);
};

// Total quantity for product = sum of stock across all variants
exports.getTotalQuantity = async (productId) => {
    const r = await prisma.productVariant.aggregate({
        where: { productId },
        _sum: { stock: true }
    });
    return r._sum.stock ?? 0;
};

// Delete (variants and their cart items cascade; legacy cart items by productId deleted explicitly)
exports.delete = async (id) => {
    const productId = id;

    // Get all associated images to delete them from filesystem
    const images = await prisma.productColorImage.findMany({
        where: { productId },
        select: { imageUrl: true }
    });

    for (const img of images) {
        await deleteFileFromUrl(img.imageUrl);
    }

    return prisma.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({ where: { productId } });
        await tx.favorite.deleteMany({ where: { productId } });
        return tx.product.delete({
            where: { id: productId }
        });
    });
};

// --- Excel: Export / Template / Import (KIDS or NEXT) ---
// Columns in order: productId, variantId, productSku, name, description, categorySlug, brandName, basePrice, isActive, isBestSeller,
//                   color, size, price, stock, lowStockThreshold, sku, image1..image8,
//                   sourceUrl, externalSku, variantExternalSku, externalColor, externalSize
// The last five are optional and used by the next.co.uk cart-push feature (NEXT audience only).
// Export uses sku and variantId as row keys; images as URL text only (no embedding, no download).
const MAX_IMAGES_PER_COLOR = 8;
const EXCEL_HEADERS = [
    'productId', 'variantId', 'productSku', 'name', 'description', 'categorySlug', 'brandName', 'basePrice', 'isActive', 'isBestSeller',
    'color', 'size', 'price', 'stock', 'lowStockThreshold', 'sku', 'available',
    ...Array.from({ length: MAX_IMAGES_PER_COLOR }, (_, i) => `image${i + 1}`),
    'sourceUrl', 'externalSku', 'variantExternalSku', 'externalColor', 'externalSize'
];

/** Export products to Excel buffer. Only products for the given audience (KIDS or NEXT); no mixing. One row per variant; images as URLs only. */
exports.exportExcel = async (audience) => {
    const products = await prisma.product.findMany({
        where: { audience },
        include: {
            category: true,
            brandRel: true,
            variants: { include: { color: true, size: true } },
            colorImages: { include: { color: true }, orderBy: { order: 'asc' } }
        },
        orderBy: { id: 'asc' }
    });

    const rows = [EXCEL_HEADERS];
    for (const p of products) {
        const categorySlug = p.category?.slug ?? '';
        const brandName = p.brandRel?.name ?? '';
        const basePrice = p.basePrice != null ? String(p.basePrice) : '';
        const isActive = p.isActive ? '1' : '0';
        const isBestSeller = p.isBestSeller ? '1' : '0';
        if (p.variants && p.variants.length > 0) {
            for (const v of p.variants) {
                const colorId = v.color?.id;
                const imagesForColor = (p.colorImages || [])
                    .filter(ci => ci.colorId === colorId)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map(ci => ci.imageUrl ?? '');
                const imageCells = Array(MAX_IMAGES_PER_COLOR).fill('');
                imagesForColor.forEach((url, idx) => { if (idx < MAX_IMAGES_PER_COLOR) imageCells[idx] = url; });
                rows.push([
                    p.id, v.id, p.sku ?? '', p.name, p.description ?? '', categorySlug, brandName, basePrice, isActive, isBestSeller,
                    v.color?.name ?? '', v.size?.name ?? '', v.price ?? '', v.stock ?? 0, v.lowStockThreshold ?? '', v.sku ?? '', v.available ?? 1,
                    ...imageCells,
                    p.sourceUrl ?? '', p.externalSku ?? '', v.externalSku ?? '', v.externalColor ?? '', v.externalSize ?? ''
                ]);
            }
        } else {
            rows.push([
                p.id, '', p.sku ?? '', p.name, p.description ?? '', categorySlug, brandName, basePrice, isActive, isBestSeller,
                '', '', '', 0, '', '', '1',
                ...Array(MAX_IMAGES_PER_COLOR).fill(''),
                p.sourceUrl ?? '', p.externalSku ?? '', '', '', ''
            ]);
        }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, audience === 'KIDS' ? 'Kids Products' : 'Next Products');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

/** Return Excel template buffer. audience = 'KIDS' | 'NEXT' */
exports.getTemplateBuffer = (audience) => {
    const isNext = audience === 'NEXT';
    const sourceUrlExample = isNext ? 'https://www.next.co.uk/style/y97922/1' : '';
    const externalSkuExample = isNext ? 'Y97-922' : '';
    const variantExternalSkuExample = isNext ? 'Y97-922-BLUE-M' : '';
    const externalColorExample = isNext ? 'Royal Blue' : '';
    const externalSizeExample = isNext ? 'M' : '';
    const exampleRow = [
        '', '', 'PRD-EXT-001', 'Example Product', 'Description', 'clothing', 'Nike', '99.99', '1', '0',
        'Red', 'M', '99.99', '10', '5', 'SKU-001', '1',
        ...Array(MAX_IMAGES_PER_COLOR).fill(''),
        sourceUrlExample, externalSkuExample, variantExternalSkuExample, externalColorExample, externalSizeExample
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, exampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

/** Resolve categoryId by slug and audience; throws if not found. */
async function resolveCategoryId(categorySlug, audience) {
    if (!categorySlug) return null;
    const cat = await prisma.category.findFirst({ where: { slug: String(categorySlug).trim(), audience } });
    if (!cat) throw AppError.badRequest(`Category "${categorySlug}" not found for ${audience}.`);
    return cat.id;
}

/**
 * Like resolveCategoryId but auto-creates the category if it doesn't exist.
 * Used by the scraper-driven import flow — next.co.uk's breadcrumb slugs (e.g. "flats",
 * "trainers") change constantly and pre-seeding every category by hand is pointless.
 */
async function resolveOrCreateCategoryId(categorySlug, audience) {
    if (!categorySlug) return null;
    const slug = String(categorySlug).trim();
    const existing = await prisma.category.findFirst({ where: { slug, audience } });
    if (existing) return existing.id;
    const name = slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const created = await prisma.category.create({
        data: { name, slug, audience }
    });
    return created.id;
}

/** Resolve brandId by name (or slug). */
async function resolveBrandId(brandName) {
    if (!brandName) return null;
    const name = String(brandName).trim();
    const brand = await prisma.brand.findFirst({ where: { name } }) ||
        await prisma.brand.findFirst({ where: { slug: name.toLowerCase().replace(/\s+/g, '-') } });
    return brand ? brand.id : null;
}

/** Import products from Excel buffer. Each row = one variant. productId or sku identifies product; variantId identifies variant. Create/update product once; create/update variant; images as URLs only. */
exports.importFromExcel = async (buffer, audience) => {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!data || data.length < 2) throw AppError.badRequest('Excel must have a header row and at least one data row.');

    const rawHeaders = data[0].map(h => (h != null ? String(h).trim().toLowerCase() : ''));
    const col = (key) => rawHeaders.findIndex(h => h === key.toLowerCase());
    const getVal = (row, key) => {
        const c = col(key);
        return (c >= 0 && row[c] != null) ? String(row[c]).trim() : '';
    };

    const created = { products: [], variants: [] };
    const updated = { products: [], variants: [] };
    let skipped = 0;
    const errors = [];
    const productCache = new Map();
    const processedProductIds = new Set();
    const updatedProductIds = new Set(); // Track which products were updated in this batch

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row.length) continue;

        const productIdStr = getVal(row, 'productId');
        const variantIdStr = getVal(row, 'variantId');
        const name = getVal(row, 'name');
        const description = getVal(row, 'description');
        const categorySlug = getVal(row, 'categorySlug');
        const brandName = getVal(row, 'brandName');
        const basePriceStr = getVal(row, 'basePrice');
        const isActiveStr = getVal(row, 'isActive');
        const isBestSellerStr = getVal(row, 'isBestSeller');
        const colorName = getVal(row, 'color');
        const sizeName = getVal(row, 'size');
        const priceStr = getVal(row, 'price');
        const stockStr = getVal(row, 'stock');
        const lowStockStr = getVal(row, 'lowStockThreshold');
        const sku = getVal(row, 'sku'); // variant sku
        const availableStr = getVal(row, 'available'); // variant availability
        const productSkuInput = getVal(row, 'productSku');
        // next.co.uk source fields (optional; NEXT audience only)
        const sourceUrlInput = getVal(row, 'sourceUrl');
        const externalSkuInput = getVal(row, 'externalSku');
        const variantExternalSkuInput = getVal(row, 'variantExternalSku');
        const externalColorInput = getVal(row, 'externalColor');
        const externalSizeInput = getVal(row, 'externalSize');

        if (!name && !productIdStr && !sku) continue;
        if (!colorName || !sizeName || !sku) {
            errors.push(`Row ${i + 1}: color, size and sku are required.`);
            continue;
        }

        let productId = null;
        let existingProduct = null;

        if (productIdStr) {
            existingProduct = await prisma.product.findFirst({
                where: { id: productIdStr, audience },
                include: { category: true, brandRel: true }
            });
            if (existingProduct) productId = existingProduct.id;
        }
        if (!productId && productSkuInput) {
            existingProduct = await prisma.product.findFirst({
                where: { sku: productSkuInput, audience },
                include: { category: true, brandRel: true }
            });
            if (existingProduct) productId = existingProduct.id;
        }
        if (!productId && sku) {
            const variantBySku = await prisma.productVariant.findFirst({
                where: { sku },
                include: { product: { include: { category: true, brandRel: true } } }
            });
            if (variantBySku?.product?.audience === audience) {
                existingProduct = variantBySku.product;
                productId = existingProduct.id;
            }
        }

        if (productId) {
            if (!processedProductIds.has(productId)) {
                try {
                    const categoryId = categorySlug ? await resolveOrCreateCategoryId(categorySlug, audience) : existingProduct.categoryId;
                    const brandId = brandName ? await resolveBrandId(brandName) : existingProduct.brandId;
                    const basePrice = basePriceStr !== '' ? parseFloat(basePriceStr) : existingProduct.basePrice;
                    const isActive = isActiveStr !== '' ? /^(1|true|yes)$/i.test(isActiveStr) : existingProduct.isActive;
                    const isBestSeller = isBestSellerStr !== '' ? /^(1|true|yes)$/i.test(isBestSellerStr) : existingProduct.isBestSeller;
                    const newSku = productSkuInput ? String(productSkuInput).trim() : existingProduct.sku;

                    const currentDesc = existingProduct.description || '';
                    const newDesc = description || existingProduct.description || '';
                    const currentBrandId = existingProduct.brandId;
                    const currentCategoryId = existingProduct.categoryId;
                    const currentName = existingProduct.name;
                    const currentBasePrice = existingProduct.basePrice;
                    const currentIsActive = existingProduct.isActive;
                    const currentIsBestSeller = existingProduct.isBestSeller;
                    const currentSku = existingProduct.sku;

                    const currentSourceUrl = existingProduct.sourceUrl;
                    const currentExternalSku = existingProduct.externalSku;
                    const newSourceUrl = sourceUrlInput !== '' ? sourceUrlInput : currentSourceUrl;
                    const newExternalSku = externalSkuInput !== '' ? externalSkuInput : currentExternalSku;

                    let needsUpdate = false;
                    if (name && name !== currentName) needsUpdate = true;
                    if (description && description !== currentDesc) needsUpdate = true;
                    if (categoryId !== currentCategoryId) needsUpdate = true;
                    if (brandId !== currentBrandId) needsUpdate = true;
                    if (basePrice !== currentBasePrice && basePrice !== null) needsUpdate = true;
                    if (isActive !== currentIsActive) needsUpdate = true;
                    if (isBestSeller !== currentIsBestSeller) needsUpdate = true;
                    if (newSku !== currentSku) needsUpdate = true;
                    if (newSourceUrl !== currentSourceUrl) needsUpdate = true;
                    if (newExternalSku !== currentExternalSku) needsUpdate = true;

                    if (needsUpdate) {
                        await prisma.product.update({
                            where: { id: productId },
                            data: {
                                name: name || undefined,
                                description: description || undefined,
                                categoryId,
                                brandId,
                                basePrice,
                                isActive,
                                isBestSeller,
                                sku: newSku,
                                sourceUrl: newSourceUrl,
                                externalSku: newExternalSku
                            }
                        });
                        updated.products.push({ id: productId, name: name || existingProduct.name });
                        updatedProductIds.add(productId);
                    }
                    processedProductIds.add(productId);
                } catch (err) {
                    errors.push(`Row ${i + 1} (Product Update): ${err.message || err}`);
                }
            }
        } else {
            if (!categorySlug) {
                errors.push(`Row ${i + 1}: categorySlug is required when creating a new product.`);
                continue;
            }
            const cacheKey = `${name || ''}|${description || ''}|${categorySlug || ''}|${brandName || ''}`;
            if (productCache.has(cacheKey)) {
                productId = productCache.get(cacheKey);
            } else {
                try {
                    const categoryId = await resolveOrCreateCategoryId(categorySlug, audience);
                    const brandId = await resolveBrandId(brandName);
                    const basePrice = basePriceStr ? parseFloat(basePriceStr) : null;
                    const isActive = /^(1|true|yes)$/i.test(isActiveStr);
                    const isBestSeller = /^(1|true|yes)$/i.test(isBestSellerStr);
                    const product = await prisma.product.create({
                        data: {
                            name: name || 'Product',
                            sku: productSkuInput || null,
                            description: description || null,
                            audience,
                            categoryId,
                            brandId,
                            basePrice,
                            isActive,
                            isBestSeller,
                            sourceUrl: sourceUrlInput || null,
                            externalSku: externalSkuInput || null
                        }
                    });
                    productId = product.id;
                    productCache.set(cacheKey, productId);
                    processedProductIds.add(productId);
                    created.products.push({ id: product.id, name: product.name });
                } catch (err) {
                    errors.push(`Row ${i + 1}: ${err.message || err}`);
                    continue;
                }
            }
        }

        const colorId = await getOrCreateColor(colorName);
        const sizeId = await getOrCreateSize(sizeName);
        if (!colorId || !sizeId) {
            errors.push(`Row ${i + 1}: invalid color or size.`);
            continue;
        }

        const price = parseFloat(priceStr) || 0;
        const stock = Math.max(0, parseInt(stockStr, 10) || 0);
        const lowStockThreshold = lowStockStr !== '' ? Math.max(0, parseInt(lowStockStr, 10) || null) : null;

        let variant = null;
        if (variantIdStr) {
            const vid = variantIdStr;
            if (vid) variant = await prisma.productVariant.findUnique({ where: { id: vid } });
        }
        if (!variant) {
            variant = await prisma.productVariant.findFirst({
                where: { productId, colorId, sizeId }
            });
        }
        if (!variant) {
            variant = await prisma.productVariant.findFirst({ where: { sku } });
        }

        // Resolve next.co.uk variant fields. For NEXT audience, the external strings
        // default to the display color/size so the extension has something to match on
        // even when the scraper doesn't emit them explicitly.
        const newExternalVariantSku = variantExternalSkuInput !== ''
            ? variantExternalSkuInput
            : (variant?.externalSku ?? null);
        const newExternalColor = externalColorInput !== ''
            ? externalColorInput
            : (variant?.externalColor ?? (audience === 'NEXT' ? colorName : null));
        const newExternalSize = externalSizeInput !== ''
            ? externalSizeInput
            : (variant?.externalSize ?? (audience === 'NEXT' ? sizeName : null));

        if (variant) {
            const same =
                Math.abs(variant.price - price) < 0.01 &&
                variant.stock === stock &&
                (variant.lowStockThreshold ?? null) === lowStockThreshold &&
                variant.sku === sku &&
                variant.available === available &&
                (variant.externalSku ?? null) === (newExternalVariantSku ?? null) &&
                (variant.externalColor ?? null) === (newExternalColor ?? null) &&
                (variant.externalSize ?? null) === (newExternalSize ?? null);

            // Force update if the product changed
            const forceUpdate = updatedProductIds.has(productId);

            if (same && !forceUpdate) {
                skipped++;
            } else {
                try {
                    await prisma.productVariant.update({
                        where: { id: variant.id },
                        data: {
                            price, stock, lowStockThreshold, sku, available,
                            externalSku: newExternalVariantSku,
                            externalColor: newExternalColor,
                            externalSize: newExternalSize
                        }
                    });
                    updated.variants.push({ id: variant.id, sku });
                } catch (err) {
                    if (err.code === 'P2002') errors.push(`Row ${i + 1}: SKU "${sku}" already used.`);
                    else errors.push(`Row ${i + 1}: ${err.message || err}`);
                }
            }
        } else {
            try {
                const newVariant = await prisma.productVariant.create({
                    data: {
                        productId,
                        colorId,
                        sizeId,
                        price,
                        stock,
                        lowStockThreshold,
                        sku,
                        available,
                        externalSku: newExternalVariantSku,
                        externalColor: newExternalColor,
                        externalSize: newExternalSize
                    }
                });
                created.variants.push({ id: newVariant.id, sku });
            } catch (err) {
                if (err.code === 'P2002') {
                    if (err.meta?.target?.includes?.('sku')) errors.push(`Row ${i + 1}: SKU "${sku}" already used.`);
                    else errors.push(`Row ${i + 1}: variant (color+size) already exists for this product.`);
                } else errors.push(`Row ${i + 1}: ${err.message || err}`);
            }
        }

        const variantProductId = variant ? variant.productId : productId;
        const imageUrls = [];
        for (let j = 1; j <= MAX_IMAGES_PER_COLOR; j++) {
            const url = getVal(row, `image${j}`);
            if (url) imageUrls.push(url);
        }
        if (imageUrls.length > 0) {
            try {
                await prisma.productColorImage.deleteMany({
                    where: { productId: variantProductId, colorId }
                });
                for (let order = 1; order <= imageUrls.length; order++) {
                    await prisma.productColorImage.create({
                        data: { productId: variantProductId, colorId, imageUrl: imageUrls[order - 1], order }
                    });
                }
            } catch (err) {
                errors.push(`Row ${i + 1} (images): ${err.message || err}`);
            }
        }
    }

    return { created, updated, skipped, errors };
};
