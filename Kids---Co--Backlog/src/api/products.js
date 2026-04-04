import { API_BASE_URL } from './config';

// Map common color names to hex for swatch display (when backend has hexCode: null) — English only
const COLOR_NAME_TO_HEX = {
    red: '#dc2626', blue: '#2563eb', green: '#16a34a', black: '#171717', white: '#fafafa',
    pink: '#ec4899', yellow: '#eab308', orange: '#ea580c', gray: '#6b7280', grey: '#6b7280',
    purple: '#7c3aed', violet: '#7c3aed', brown: '#92400e', navy: '#1e3a8a', beige: '#d6d3d1',
    cream: '#fef3c7', gold: '#ca8a04', silver: '#9ca3af', burgundy: '#881337', teal: '#0d9488',
    lime: '#84cc16', cyan: '#06b6d4', coral: '#f43f5e', mint: '#5eead4', lavender: '#c4b5fd',
    maroon: '#9f1239', olive: '#84cc16', mustard: '#eab308', peach: '#fdba74', charcoal: '#404040',
    rose: '#f43f5e', salmon: '#fb7185', magenta: '#c026d3', indigo: '#4f46e5', sky: '#0ea5e9',
    turquoise: '#14b8a6', emerald: '#10b981', forest: '#15803d', sage: '#84cc16', 'olive green': '#65a30d',
    amber: '#f59e0b', tangerine: '#f97316', rust: '#c2410c', terracotta: '#b45309', sand: '#d6d3d1',
    ivory: '#fffff0', offwhite: '#f8fafc', snow: '#fafafa', slate: '#64748b', graphite: '#475569',
    wine: '#9f1239', plum: '#7e22ce', fuchsia: '#c026d3', lilac: '#c084fc', mauve: '#a78bfa',
    denim: '#1e40af', aqua: '#22d3ee', petrol: '#0e7490', steel: '#94a3b8', ash: '#94a3b8',
    khaki: '#737373', tan: '#d4a574', camel: '#c4a574', chocolate: '#78350f', coffee: '#6f4e37',
    honey: '#fbbf24', butter: '#fef08a', vanilla: '#fef9c3', milk: '#f8fafc', pearl: '#e2e8f0',
};

// Helper to normalize product data from backend (supports Prisma: variants, colorImages, category, brandRel)
export const normalizeProduct = (product) => {
    if (!product) return null;
    const parsedRate = Number(product.category?.exchangeRateToEgp ?? product.categoryExchangeRateToEgp ?? 1);
    const exchangeRateToEgp = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 1;

    // Thumbnails (legacy)
    let thumbnails = [];
    try {
        if (typeof product.thumbnails === 'string') thumbnails = JSON.parse(product.thumbnails);
        else if (Array.isArray(product.thumbnails)) thumbnails = product.thumbnails;
    } catch (e) { /* ignore */ }

    // Colors: use names and families for filtering
    let colors = [];
    let colorFamilies = [];
    if (product.variants && product.variants.length > 0) {
        const seenColors = new Set();
        const seenFamilies = new Set();
        product.variants.forEach((v) => {
            const name = v.color?.name;
            const family = v.color?.family;
            if (name && !seenColors.has(name)) {
                seenColors.add(name);
                colors.push(name);
            }
            if (family && !seenFamilies.has(family)) {
                seenFamilies.add(family);
                colorFamilies.push(family);
            }
        });
    }
    if (colors.length === 0 && typeof product.colors === 'string') {
        try { colors = JSON.parse(product.colors); } catch (e) { /* ignore */ }
    } else if (colors.length === 0 && Array.isArray(product.colors)) colors = product.colors;

    // Sizes: from variants (size.name) or legacy product.sizes
    let sizes = [];
    if (product.variants && product.variants.length > 0) {
        const seen = new Set();
        product.variants.forEach((v) => {
            const s = v.size?.name;
            if (s && !seen.has(s)) { seen.add(s); sizes.push(s); }
        });
    }
    if (sizes.length === 0 && typeof product.sizes === 'string') {
        try { sizes = JSON.parse(product.sizes); } catch (e) { /* ignore */ }
    } else if (sizes.length === 0 && Array.isArray(product.sizes)) sizes = product.sizes;

    // Images: from colorImages (imageUrl, order) or legacy image/thumbnails/images
    let allImages = [];
    if (product.colorImages && product.colorImages.length > 0) {
        const byOrder = [...product.colorImages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        allImages = byOrder.map((ci) => ci.imageUrl).filter(Boolean);
    }
    if (allImages.length === 0 && Array.isArray(product.images) && product.images.length > 0) allImages = product.images;
    if (allImages.length === 0 && thumbnails.length > 0) allImages = thumbnails;
    const mainImage = product.image || allImages[0] || null;
    if (mainImage && !allImages.includes(mainImage)) allImages = [mainImage, ...allImages];
    if (allImages.length === 0 && mainImage) allImages = [mainImage];

    // Price shown to customer is always EGP
    const rawPrice = product.basePrice ?? product.variants?.[0]?.price ?? product.price;
    const price = rawPrice != null ? Number(rawPrice) * exchangeRateToEgp : rawPrice;
    const variants = Array.isArray(product.variants)
        ? product.variants.map((v) => ({
            ...v,
            price: Number(v.price ?? 0) * exchangeRateToEgp
        }))
        : product.variants;

    return {
        ...product,
        variants,
        name: product.name || product.title || 'Untitled Product',
        image: mainImage,
        images: allImages,
        price,
        colors: colors.length > 0 ? colors : null,
        colorFamilies: colorFamilies.length > 0 ? colorFamilies : [],
        sizes: sizes.length > 0 ? sizes : null,
        categorySlug: product.category?.slug || product.categorySlug || null,
        categoryName: product.category?.name || product.categoryDisplay || 'Category',
        categoryCurrencyCode: product.category?.currencyCode || product.categoryCurrencyCode || 'EGP',
        categoryExchangeRateToEgp: exchangeRateToEgp,
        brand: product.brandRel?.name ?? product.brand ?? null,
        brandSlug: product.brandRel?.slug || product.brandSlug || null
    };
};

// First image URL for a product (from colorImages or images or image)
export const getProductFirstImage = (product) => {
    if (!product) return null;
    const fromColorImages = product.colorImages?.[0]?.imageUrl;
    if (fromColorImages) return fromColorImages;
    if (Array.isArray(product.images) && product.images[0]) return product.images[0];
    return product.image || null;
};

// First image URL for a product for a specific color (case-insensitive) — for order items
export const getProductImageForColor = (product, colorName) => {
    if (!product) return null;
    if (!colorName || !product.colorImages?.length) return getProductFirstImage(product);
    const nameLower = String(colorName).toLowerCase().trim();
    const match = product.colorImages
        .filter((ci) => {
            const n = (ci.color?.name ?? ci.colorName ?? '').toString().toLowerCase().trim();
            return n && n === nameLower;
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return match[0]?.imageUrl || getProductFirstImage(product);
};

// Get display color for swatch (hex or fallback from name) — case-insensitive
export const getColorSwatchStyle = (color) => {
    if (!color) return {};
    if (typeof color === 'string' && /^#([0-9A-Fa-f]{3}){1,2}$/.test(color)) return { backgroundColor: color };
    const key = typeof color === 'string' ? color.toLowerCase().trim() : color;
    const hex = COLOR_NAME_TO_HEX[key];
    if (hex) return { backgroundColor: hex };
    return {};
};

// Get all products with optional filters
export const fetchProducts = async (filters = {}) => {
    try {
        const params = new URLSearchParams();

        if (filters.audience) params.append('audience', filters.audience);
        if (filters.bestSeller) params.append('bestSeller', 'true');
        if (filters.category) params.append('category', filters.category);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.brands && filters.brands.length > 0) params.append('brands', filters.brands.join(','));
        if (filters.colors && filters.colors.length > 0) params.append('colors', filters.colors.join(','));
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.search) params.append('search', filters.search);

        const url = `${API_BASE_URL}/products${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch products');
        }

        // Normalize all products in the array
        if (data.success && Array.isArray(data.data)) {
            data.data = data.data.map(normalizeProduct);
        }

        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

// Get best seller products
export const fetchBestSellers = async (audience = null) => {
    return fetchProducts({ audience, bestSeller: true });
};

// Get available colors
export const fetchColors = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/colors`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch colors');
        }

        return data;
    } catch (error) {
        console.error('Error fetching colors:', error);
        throw error;
    }
};

// Get single product by ID
export const fetchProductById = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch product');
        }

        // Normalize the single product
        if (data.success && data.data) {
            data.data = normalizeProduct(data.data);
        }

        return data;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

