const prisma = require('../../config/db');

const TIMEZONE = 'Africa/Cairo';

// Revenue: Card from CONFIRMED+; COD from DELIVERED+. Cancelled and refunded orders excluded.
const revenueWhere = {
    OR: [
        { paymentMethod: 'CARD', status: { in: ['CONFIRMED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'RETURNED'] } },
        { paymentMethod: 'COD', status: { in: ['DELIVERED', 'COMPLETED', 'RETURNED'] } }
    ]
};

function addDays(d, days) {
    const out = new Date(d);
    out.setDate(out.getDate() + days);
    return out;
}

/** Egypt (Africa/Cairo) offset: UTC+2 (no DST as of recent years) */
const CAIRO_OFFSET_MS = 2 * 60 * 60 * 1000;

/** Get calendar date (y, m, d) in Africa/Cairo for a given instant */
function getCairoDate(d) {
    const cairoInstant = new Date(d.getTime() + CAIRO_OFFSET_MS);
    return {
        year: cairoInstant.getUTCFullYear(),
        month: cairoInstant.getUTCMonth(),
        day: cairoInstant.getUTCDate()
    };
}

/** Start of day in Africa/Cairo for the date of `d` (returns Date, UTC) */
function startOfDayCairo(d) {
    const { year, month, day } = getCairoDate(d);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - CAIRO_OFFSET_MS);
}

/** End of day 23:59:59.999 in Africa/Cairo for the date of `d` */
function endOfDayCairo(d) {
    const { year, month, day } = getCairoDate(d);
    return new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - CAIRO_OFFSET_MS);
}

function startOfDay(d) {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    return out;
}

function endOfDay(d) {
    const out = new Date(d);
    out.setHours(23, 59, 59, 999);
    return out;
}

/**
 * Get date range for preset: today | week | month | custom (timezone Africa/Cairo for today/week/month).
 * custom uses from/to from query (ISO strings), interpreted in Cairo for consistency.
 * Returns { from, to } (Date), and { fromPrev, toPrev } for previous period (same length).
 */
function getDateRanges(preset, fromStr, toStr) {
    const now = new Date();
    let from, to;
    if (preset === 'today') {
        from = startOfDayCairo(now);
        to = endOfDayCairo(now);
    } else if (preset === 'week') {
        const { year, month, day } = getCairoDate(now);
        const cairoDate = new Date(year, month, day);
        const dayOfWeek = cairoDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = addDays(cairoDate, mondayOffset);
        from = startOfDay(weekStart);
        to = endOfDay(addDays(weekStart, 6));
    } else if (preset === 'month') {
        const { year, month } = getCairoDate(now);
        from = new Date(year, month, 1);
        to = endOfDay(new Date(year, month + 1, 0));
    } else if (preset === 'custom' && fromStr && toStr) {
        from = startOfDay(new Date(fromStr));
        to = endOfDay(new Date(toStr));
    } else {
        const { year, month } = getCairoDate(now);
        from = new Date(year, month, 1);
        to = endOfDay(new Date(year, month + 1, 0));
    }
    const ms = to - from + 1;
    const toPrev = new Date(from.getTime() - 1);
    const fromPrev = new Date(toPrev.getTime() - ms + 1);
    return { from, to, fromPrev, toPrev };
}

function baseWhere(from, to, statusFilter) {
    const w = {
        createdAt: { gte: from, lte: to }
    };
    if (statusFilter && statusFilter !== '') {
        w.status = statusFilter;
    }
    return w;
}

/**
 * 1. Sales by Period — current period revenue + previous period revenue + % change
 */
async function getSalesByPeriod(from, to, fromPrev, toPrev, statusFilter) {
    const whereCurrent = { ...revenueWhere, ...baseWhere(from, to, statusFilter) };
    const wherePrev = { ...revenueWhere, ...baseWhere(fromPrev, toPrev, statusFilter) };

    const [currentRes, prevRes] = await Promise.all([
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: whereCurrent }),
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: wherePrev })
    ]);

    const current = Number(currentRes._sum.totalAmount || 0);
    const previous = Number(prevRes._sum.totalAmount || 0);
    let changePercent = null;
    if (previous !== 0) {
        changePercent = ((current - previous) / previous) * 100;
    } else if (current !== 0) {
        changePercent = 100;
    }

    return {
        currentPeriod: { revenue: current, from, to },
        previousPeriod: { revenue: previous, from: fromPrev, to: toPrev },
        changePercent
    };
}

/**
 * 2. Orders Status Report — count per status + percentage of total orders in period
 */
async function getOrdersStatusReport(from, to, statusFilter) {
    const where = baseWhere(from, to, statusFilter);
    const total = await prisma.order.count({ where });
    const byStatus = await prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        where
    });

    const statuses = byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        percent: total > 0 ? (s._count.id / total) * 100 : 0
    }));

    return { total, byStatus: statuses };
}

/**
 * 3. Payment Methods — COD, CARD: order count + total amount (revenue logic per method)
 */
async function getPaymentMethodsReport(from, to, statusFilter) {
    const whereBase = baseWhere(from, to, statusFilter);

    const codRevenueWhere = { ...whereBase, paymentMethod: 'COD', status: { in: ['DELIVERED', 'COMPLETED', 'RETURNED'] } };
    const cardRevenueWhere = { ...whereBase, paymentMethod: 'CARD', status: { in: ['CONFIRMED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'RETURNED'] } };

    const [codOrders, cardOrders, codRevenue, cardRevenue] = await Promise.all([
        prisma.order.count({ where: { ...whereBase, paymentMethod: 'COD' } }),
        prisma.order.count({ where: { ...whereBase, paymentMethod: 'CARD' } }),
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: codRevenueWhere }),
        prisma.order.aggregate({ _sum: { totalAmount: true }, where: cardRevenueWhere })
    ]);

    return {
        COD: { orderCount: codOrders, totalAmount: Number(codRevenue._sum.totalAmount || 0) },
        CARD: { orderCount: cardOrders, totalAmount: Number(cardRevenue._sum.totalAmount || 0) }
    };
}

/**
 * 4. Returns Report — count RETURNED/REFUNDED, total refunded amount (EGP), return reasons with count and amount
 */
async function getReturnsReport(from, to) {
    const where = {
        createdAt: { gte: from, lte: to },
        status: { in: ['RETURNED', 'REFUNDED'] }
    };
    const orders = await prisma.order.findMany({
        where,
        select: { id: true, totalAmount: true, returnReason: true, status: true }
    });

    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const byReason = {};
    orders.forEach((o) => {
        const r = (o.returnReason || '').trim() || '(No reason)';
        if (!byReason[r]) byReason[r] = { count: 0, amount: 0 };
        byReason[r].count += 1;
        byReason[r].amount += Number(o.totalAmount || 0);
    });
    const reasons = Object.entries(byReason).map(([reason, data]) => ({
        reason,
        count: data.count,
        amount: Number(data.amount.toFixed(2))
    }));

    return {
        count: orders.length,
        totalAmount: Number(totalAmount.toFixed(2)),
        reasons
    };
}

/**
 * 5. Products Report (light) — not sold in period; most cancelled (products in CANCELED orders)
 */
async function getProductsReport(from, to) {
    // Order IDs created in period with status CANCELED
    const canceledOrderIds = await prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to }, status: 'CANCELED' },
        select: { id: true }
    }).then((rows) => rows.map((r) => r.id));

    // Product IDs that were sold in period (any order item in non-canceled orders)
    const soldProductIds = await prisma.orderItem.findMany({
        where: {
            order: {
                createdAt: { gte: from, lte: to },
                status: { not: 'CANCELED' }
            },
            productId: { not: null }
        },
        select: { productId: true }
    }).then((rows) => [...new Set(rows.map((r) => r.productId).filter(Boolean))]);

    const allProductIds = await prisma.product.findMany({ select: { id: true } }).then((rows) => rows.map((r) => r.id));
    const notSoldInPeriod = allProductIds.filter((id) => !soldProductIds.includes(id));

    // Products with most cancelled (order items in CANCELED orders in period)
    let cancelledByProduct = [];
    if (canceledOrderIds.length > 0) {
        const items = await prisma.orderItem.findMany({
            where: { orderId: { in: canceledOrderIds }, productId: { not: null } },
            select: { productId: true }
        });
        const countByProduct = {};
        items.forEach((i) => {
            countByProduct[i.productId] = (countByProduct[i.productId] || 0) + 1;
        });
        cancelledByProduct = Object.entries(countByProduct)
            .map(([productId, count]) => ({ productId, cancelledCount: count }))
            .sort((a, b) => b.cancelledCount - a.cancelledCount)
            .slice(0, 20);
    }

    const notSoldProducts = await prisma.product.findMany({
        where: { id: { in: notSoldInPeriod.slice(0, 50) } },
        select: { id: true, name: true }
    });

    const cancelledProductIds = cancelledByProduct.map((p) => p.productId);
    const cancelledProducts = cancelledProductIds.length
        ? await prisma.product.findMany({
            where: { id: { in: cancelledProductIds } },
            select: { id: true, name: true }
        }).then((list) => {
            const map = Object.fromEntries(list.map((p) => [p.id, p]));
            return cancelledByProduct.map((p) => ({ ...p, name: map[p.productId]?.name || '—' }));
        })
        : [];

    return {
        notSoldInPeriod: notSoldProducts,
        mostCancelled: cancelledProducts
    };
}

/**
 * Full reports for dashboard. Snapshot-based, Africa/Cairo timezone for date ranges.
 * Query: preset (today|week|month|custom), from, to (for custom), status (optional).
 * Currency EGP; amounts with 2 decimal places. Cancelled/refunded excluded from revenue.
 */
exports.getReports = async (query = {}) => {
    const preset = query.preset || 'month';
    const { from, to, fromPrev, toPrev } = getDateRanges(preset, query.from, query.to);
    const statusFilter = query.status && query.status !== '' ? query.status : null;

    const [salesByPeriod, ordersStatus, paymentMethods, returns, products] = await Promise.all([
        getSalesByPeriod(from, to, fromPrev, toPrev, statusFilter),
        getOrdersStatusReport(from, to, statusFilter),
        getPaymentMethodsReport(from, to, statusFilter),
        getReturnsReport(from, to),
        getProductsReport(from, to)
    ]);

    const generatedAt = new Date().toISOString();

    return {
        dateRange: { from, to, fromPrev, toPrev, preset, timezone: TIMEZONE, generatedAt },
        salesByPeriod: {
            ...salesByPeriod,
            currentPeriod: salesByPeriod.currentPeriod ? { ...salesByPeriod.currentPeriod, revenue: Number(Number(salesByPeriod.currentPeriod.revenue).toFixed(2)) } : salesByPeriod.currentPeriod,
            previousPeriod: salesByPeriod.previousPeriod ? { ...salesByPeriod.previousPeriod, revenue: Number(Number(salesByPeriod.previousPeriod.revenue).toFixed(2)) } : salesByPeriod.previousPeriod
        },
        ordersStatusReport: ordersStatus,
        paymentMethodsReport: {
            COD: { orderCount: paymentMethods.COD.orderCount, totalAmount: Number(Number(paymentMethods.COD.totalAmount).toFixed(2)) },
            CARD: { orderCount: paymentMethods.CARD.orderCount, totalAmount: Number(Number(paymentMethods.CARD.totalAmount).toFixed(2)) }
        },
        returnsReport: returns,
        productsReport: products
    };
};
