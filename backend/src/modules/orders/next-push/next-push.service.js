const { randomUUID } = require('crypto');
const prisma = require('../../../config/db');
const AppError = require('../../../utils/AppError');

/**
 * Start a new next.co.uk cart-push run for an order.
 * Creates one QUEUED log row per NEXT item and returns the payload the
 * admin dashboard forwards to the browser extension via postMessage.
 *
 * Throws if the order has no NEXT items, or if any NEXT item is missing a
 * product-level sourceUrl (the extension can't navigate without it).
 */
exports.startPush = async (orderId, userId) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    product: true,
                    productVariant: true
                }
            }
        }
    });
    if (!order) throw AppError.notFound('Order not found');

    const nextItems = order.items.filter(it => it.product?.audience === 'NEXT');
    if (nextItems.length === 0) {
        throw AppError.badRequest('This order has no NEXT items to push.');
    }

    const missingUrl = nextItems.find(it => !it.product?.sourceUrl);
    if (missingUrl) {
        throw AppError.badRequest(
            `Product "${missingUrl.product?.name || missingUrl.productName || missingUrl.productId}" is missing a next.co.uk source URL. Open the product and paste its URL before pushing.`
        );
    }

    const correlationId = randomUUID();

    // Create QUEUED rows in one transaction so the history view is consistent.
    await prisma.$transaction(
        nextItems.map(it =>
            prisma.orderNextPushLog.create({
                data: {
                    orderId: order.id,
                    orderItemId: it.id,
                    correlationId,
                    status: 'QUEUED',
                    pushedBy: userId || null
                }
            })
        )
    );

    // Build the payload the extension expects (Spec 2 from the plan).
    const items = nextItems.map(it => ({
        orderItemId: it.id,
        sourceUrl: it.product.sourceUrl,
        externalColor: it.productVariant?.externalColor || it.color || null,
        externalSize: it.productVariant?.externalSize || it.size || null,
        quantity: it.quantity
    }));

    return { correlationId, items };
};

/**
 * Record the result of a single item's push attempt.
 * Upserts on (correlationId, orderItemId).
 */
exports.recordResult = async (orderId, { correlationId, orderItemId, status, message }) => {
    if (!correlationId || !orderItemId || !status) {
        throw AppError.badRequest('correlationId, orderItemId and status are required');
    }
    const ALLOWED = ['ADDED', 'UNAVAILABLE', 'FAILED'];
    if (!ALLOWED.includes(status)) {
        throw AppError.badRequest(`status must be one of ${ALLOWED.join(', ')}`);
    }

    // Confirm the target row belongs to this order before updating.
    const existing = await prisma.orderNextPushLog.findUnique({
        where: { correlationId_orderItemId: { correlationId, orderItemId } }
    });
    if (!existing || existing.orderId !== orderId) {
        throw AppError.notFound('Push log row not found for this order');
    }

    await prisma.orderNextPushLog.update({
        where: { correlationId_orderItemId: { correlationId, orderItemId } },
        data: { status, message: message || null }
    });
};

/**
 * Start a batched next.co.uk cart-push run that spans multiple orders. All NEXT items
 * across the supplied orders are queued under one correlationId and bundled into a
 * single payload — the extension feeds them into the same shopping bag in sequence,
 * so the admin can check out once for several customer orders.
 *
 * Validation matches startPush per order: every supplied order must exist, must contain
 * at least one NEXT item, and every NEXT item must have a product-level sourceUrl.
 */
exports.startBatchPush = async (orderIds, userId) => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw AppError.badRequest('orderIds is required and must contain at least one order');
    }
    const uniqueIds = Array.from(new Set(orderIds.filter(id => typeof id === 'string' && id.length > 0)));
    if (uniqueIds.length === 0) {
        throw AppError.badRequest('orderIds is required and must contain at least one order');
    }

    const orders = await prisma.order.findMany({
        where: { id: { in: uniqueIds } },
        include: {
            items: {
                include: {
                    product: true,
                    productVariant: true
                }
            }
        }
    });

    const foundIds = new Set(orders.map(o => o.id));
    const missingIds = uniqueIds.filter(id => !foundIds.has(id));
    if (missingIds.length) {
        throw AppError.notFound(`Order(s) not found: ${missingIds.join(', ')}`);
    }

    // Per-order validation, collecting NEXT items into one flat list.
    const flatItems = [];
    for (const order of orders) {
        const nextItems = order.items.filter(it => it.product?.audience === 'NEXT');
        if (nextItems.length === 0) {
            throw AppError.badRequest(`Order ${order.id} has no NEXT items to push.`);
        }
        const missingUrl = nextItems.find(it => !it.product?.sourceUrl);
        if (missingUrl) {
            throw AppError.badRequest(
                `Order ${order.id}: product "${missingUrl.product?.name || missingUrl.productName || missingUrl.productId}" is missing a next.co.uk source URL. Open the product and paste its URL before pushing.`
            );
        }
        for (const it of nextItems) {
            flatItems.push({ orderId: order.id, item: it });
        }
    }

    const correlationId = randomUUID();

    // Create all QUEUED rows in one transaction so cross-order history stays consistent.
    await prisma.$transaction(
        flatItems.map(({ orderId, item }) =>
            prisma.orderNextPushLog.create({
                data: {
                    orderId,
                    orderItemId: item.id,
                    correlationId,
                    status: 'QUEUED',
                    pushedBy: userId || null
                }
            })
        )
    );

    // Each item carries its own orderId so the extension can POST results to the right URL.
    const items = flatItems.map(({ orderId, item }) => ({
        orderId,
        orderItemId: item.id,
        sourceUrl: item.product.sourceUrl,
        externalColor: item.productVariant?.externalColor || item.color || null,
        externalSize: item.productVariant?.externalSize || item.size || null,
        quantity: item.quantity
    }));

    return { correlationId, items };
};

/**
 * Return all log rows for a single correlationId, regardless of how many parent orders.
 * Powers the merged-push polling view in the admin dashboard.
 */
exports.getHistoryByCorrelation = async (correlationId) => {
    if (!correlationId) {
        throw AppError.badRequest('correlationId is required');
    }
    const rows = await prisma.orderNextPushLog.findMany({
        where: { correlationId },
        orderBy: { createdAt: 'asc' }
    });
    if (rows.length === 0) {
        throw AppError.notFound('No push run found for that correlationId');
    }
    return {
        correlationId,
        createdAt: rows[0].createdAt,
        items: rows.map(r => ({
            orderId: r.orderId,
            orderItemId: r.orderItemId,
            status: r.status,
            message: r.message,
            updatedAt: r.updatedAt
        }))
    };
};

/**
 * Return log rows for an order, newest correlation first, grouped by correlationId.
 */
exports.getHistory = async (orderId) => {
    const rows = await prisma.orderNextPushLog.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' }
    });
    const grouped = new Map();
    for (const r of rows) {
        if (!grouped.has(r.correlationId)) {
            grouped.set(r.correlationId, { correlationId: r.correlationId, createdAt: r.createdAt, items: [] });
        }
        grouped.get(r.correlationId).items.push({
            orderItemId: r.orderItemId,
            status: r.status,
            message: r.message,
            updatedAt: r.updatedAt
        });
    }
    return Array.from(grouped.values());
};
