const productService = require('./products.service');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { cache } = require('../../utils/cache');
const { parsePaginationParams, createPaginatedResponse } = require('../../utils/pagination');

// Cache TTL in seconds
const CACHE_TTL = {
    PRODUCTS_LIST: 300, // 5 minutes
    PRODUCT_DETAIL: 600, // 10 minutes
    COLORS: 3600 // 1 hour
};

/**
 * Get unique colors
 * GET /api/products/colors
 */
exports.getColors = asyncHandler(async (req, res) => {
    const cacheKey = 'products:colors';
    let colors = cache.get(cacheKey);

    if (!colors) {
        colors = await productService.getUniqueColors();
        cache.set(cacheKey, colors, CACHE_TTL.COLORS);
    }

    res.json({ success: true, data: colors });
});

/**
 * Create product
 * POST /api/products
 */
exports.create = asyncHandler(async (req, res) => {
    const { audience } = req.body;
    const userRole = req.user.role;

    // Strict Check: Admin Kids cannot create Next products, etc.
    if (userRole === 'ADMIN_KIDS' && audience !== 'KIDS') {
        throw AppError.forbidden('You can only create KIDS products');
    }
    if (userRole === 'ADMIN_NEXT' && audience !== 'NEXT') {
        throw AppError.forbidden('You can only create NEXT products');
    }

    const product = await productService.create(req.body);

    // Invalidate related caches (including colors so new color appears in filter)
    cache.delByPattern('products:*');
    cache.del('products:colors');

    res.status(201).json({ success: true, data: product });
});

/**
 * Get all products with filtering, sorting, and pagination
 * GET /api/products
 */
exports.findAll = asyncHandler(async (req, res) => {
    let filter = {};
    const user = req.user;

    // Role-based filtering
    if (user) {
        if (user.role === 'ADMIN_KIDS') filter.audience = 'KIDS';
        else if (user.role === 'ADMIN_NEXT') filter.audience = 'NEXT';
        else if (req.query.audience) filter.audience = req.query.audience;
        filter.includeInactive = true; // Admin dashboard: show all products (active + inactive)
    } else if (req.query.audience) {
        filter.audience = req.query.audience;
    }

    // Filter by bestSeller
    if (req.query.bestSeller === 'true') {
        filter.isBestSeller = true;
    }

    // Filter by category slug
    if (req.query.category) {
        filter.categorySlug = req.query.category;
    }

    // Price range
    if (req.query.minPrice) filter.minPrice = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) filter.maxPrice = parseFloat(req.query.maxPrice);

    // Brands filter
    if (req.query.brands) {
        filter.brands = req.query.brands.split(',');
    }

    // Colors filter
    if (req.query.colors) {
        filter.colors = req.query.colors.split(',');
    }

    // Sorting
    if (req.query.sortBy) {
        filter.sortBy = req.query.sortBy;
    }

    // Search
    if (req.query.search) {
        filter.search = req.query.search;
    }

    // Pagination
    const pagination = parsePaginationParams(req.query, { limit: 50 });

    // Generate cache key based on all params
    const cacheKey = `products:list:${JSON.stringify({ filter, pagination })}`;
    let result = cache.get(cacheKey);

    if (!result) {
        const { products, total, stats } = await productService.findAllPaginated(filter, pagination);
        result = createPaginatedResponse(products, total, pagination);
        result.stats = stats; // Attach stats to response
        cache.set(cacheKey, result, CACHE_TTL.PRODUCTS_LIST);
    }

    res.json(result);
});

/**
 * Get single product
 * GET /api/products/:id
 */
exports.findOne = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cacheKey = `products:detail:${id}`;

    let product = cache.get(cacheKey);

    if (!product) {
        product = await productService.findOne(id);
        if (!product) {
            throw AppError.notFound('Product not found');
        }
        cache.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);
    }

    res.json({ success: true, data: product });
});

/**
 * Update product
 * PUT /api/products/:id
 */
exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;

    // Fetch existing product to check ownership
    const existing = await productService.findOne(id);
    if (!existing) {
        throw AppError.notFound('Product not found');
    }

    // Enforce Scope
    if (userRole === 'ADMIN_KIDS' && existing.audience !== 'KIDS') {
        throw AppError.forbidden('Access denied to non-KIDS product');
    }
    if (userRole === 'ADMIN_NEXT' && existing.audience !== 'NEXT') {
        throw AppError.forbidden('Access denied to non-NEXT product');
    }

    const product = await productService.update(id, req.body);

    // Invalidate related caches (including colors so new color appears in filter)
    cache.del(`products:detail:${id}`);
    cache.delByPattern('products:list:*');
    cache.del('products:colors');

    res.json({ success: true, data: product });
});

/**
 * Delete product
 * DELETE /api/products/:id
 */
exports.delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.role;

    // Fetch existing product to check ownership
    const existing = await productService.findOne(id);
    if (!existing) {
        throw AppError.notFound('Product not found');
    }

    // Enforce Scope
    if (userRole === 'ADMIN_KIDS' && existing.audience !== 'KIDS') {
        throw AppError.forbidden('Access denied to non-KIDS product');
    }
    if (userRole === 'ADMIN_NEXT' && existing.audience !== 'NEXT') {
        throw AppError.forbidden('Access denied to non-NEXT product');
    }

    await productService.delete(id);

    // Invalidate related caches
    cache.del(`products:detail:${id}`);
    cache.delByPattern('products:list:*');
    cache.del('products:colors');

    res.json({ success: true, message: 'Product deleted' });
});

/** Export products to Excel. GET /api/products/export/:audience (kids|next) */
exports.exportExcel = asyncHandler(async (req, res) => {
    const audience = (req.params.audience || '').toUpperCase();
    if (audience !== 'KIDS' && audience !== 'NEXT') throw AppError.badRequest('Invalid audience');
    if (req.user?.role === 'ADMIN_KIDS' && audience !== 'KIDS') throw AppError.forbidden('Kids admin can only export KIDS');
    if (req.user?.role === 'ADMIN_NEXT' && audience !== 'NEXT') throw AppError.forbidden('Next admin can only export NEXT');
    let buffer;
    try {
        buffer = await productService.exportExcel(audience);
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Export failed' });
    }
    const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${audience.toLowerCase()}-products.xlsx`);
    res.setHeader('Content-Length', data.length);
    res.send(data);
});

/** Download Excel template. GET /api/products/template/:audience (kids|next) */
exports.templateExcel = asyncHandler(async (req, res) => {
    const audience = (req.params.audience || '').toUpperCase();
    if (audience !== 'KIDS' && audience !== 'NEXT') throw AppError.badRequest('Invalid audience');
    if (req.user?.role === 'ADMIN_KIDS' && audience !== 'KIDS') throw AppError.forbidden('Kids admin can only get KIDS template');
    if (req.user?.role === 'ADMIN_NEXT' && audience !== 'NEXT') throw AppError.forbidden('Next admin can only get NEXT template');
    const buffer = productService.getTemplateBuffer(audience);
    const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${audience.toLowerCase()}-products-template.xlsx`);
    res.setHeader('Content-Length', data.length);
    res.send(data);
});

/** Import products from Excel. POST /api/products/import/:audience (kids|next), body: file (multipart) */
exports.importExcel = asyncHandler(async (req, res) => {
    const audience = (req.params.audience || '').toUpperCase();
    if (audience !== 'KIDS' && audience !== 'NEXT') throw AppError.badRequest('Invalid audience');
    if (req.user?.role === 'ADMIN_KIDS' && audience !== 'KIDS') throw AppError.forbidden('Kids admin can only import KIDS');
    if (req.user?.role === 'ADMIN_NEXT' && audience !== 'NEXT') throw AppError.forbidden('Next admin can only import NEXT');
    if (!req.file || !req.file.buffer) throw AppError.badRequest('No Excel file uploaded');
    const { created, updated, skipped, errors, warnings } = await productService.importFromExcel(req.file.buffer, audience);
    cache.delByPattern('products:*');
    cache.del('products:colors');
    res.status(201).json({
        success: true,
        data: {
            created: { products: created.products, variants: created.variants },
            updated: { products: updated.products, variants: updated.variants },
            skipped,
            errors: errors.length ? errors : undefined,
            warnings: warnings && warnings.length ? warnings : undefined
        }
    });
});
