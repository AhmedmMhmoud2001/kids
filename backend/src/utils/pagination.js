/**
 * Pagination Utility
 * Provides helper functions for implementing pagination
 */

/**
 * Parse pagination parameters from request query
 * @param {object} query - Request query object
 * @param {object} defaults - Default values
 * @returns {object} Pagination parameters
 */
const parsePaginationParams = (query, defaults = {}) => {
    const page = Math.max(1, parseInt(query.page) || defaults.page || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || defaults.limit || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Create pagination response object
 * @param {array} data - Array of items
 * @param {number} total - Total count
 * @param {object} params - Pagination parameters
 * @returns {object} Paginated response
 */
const createPaginatedResponse = (data, total, params) => {
    const { page, limit } = params;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;
    const hasPrev = page > 1;

    return {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore,
            hasPrev
        }
    };
};

/**
 * Prisma pagination helper
 * @param {object} params - Pagination parameters
 * @returns {object} Prisma skip/take options
 */
const prismaPagination = (params) => {
    return {
        skip: params.skip,
        take: params.limit
    };
};

module.exports = {
    parsePaginationParams,
    createPaginatedResponse,
    prismaPagination
};
