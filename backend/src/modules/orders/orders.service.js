const prisma = require('../../config/db');
const notificationsService = require('../notifications/notifications.service');
const { cache } = require('../../utils/cache');

// إبطال كاش المنتجات بعد تغيير المخزون حتى تظهر الأرقام المحدثة بدون ريفرش السيرفر
const invalidateProductsCacheForOrder = (order) => {
    if (!order?.items?.length) return;
    const productIds = [...new Set(order.items.map(i => i.productId).filter(Boolean))];
    productIds.forEach(pid => cache.del(`products:detail:${pid}`));
    cache.delByPattern('products:list:*');
};

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const resolveCategoryRateToEgp = (product) => {
    const raw = Number(product?.category?.exchangeRateToEgp);
    if (!Number.isFinite(raw) || raw <= 0) return 1;
    return raw;
};

const calculateDualCurrencyTotals = (totalAmountEgp, usdToEgpRate) => {
    const safeRate = Number.isFinite(Number(usdToEgpRate)) && Number(usdToEgpRate) > 0
        ? Number(usdToEgpRate)
        : 50;
    const egp = round2(totalAmountEgp);
    const usd = round2(egp / safeRate);
    return {
        totalAmountEgp: egp,
        totalAmountUsd: usd,
        exchangeRateUsdToEgp: safeRate
    };
};

// خصم مخزون الـ variant عند تغيير الطلب إلى CONFIRMED أو PAID — يعتمد على productVariantId في بند الطلب
// الخصم يتم داخل transaction منفصلة حتى يُحفظ في الداتابيز، ثم نرسل إشعار Out of Stock بعد الـ commit فقط
const decrementStockForOrder = async (orderId, tx = null) => {
    const db = tx || prisma;
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });
    if (!order || !order.items?.length) return;

    const zeroedVariants = []; // { productName, detail } لإنشاء الإشعار بعد الـ commit فقط

    const runDecrements = async (client) => {
        for (const item of order.items) {
            const qty = Math.max(0, item.quantity || 0);
            if (qty <= 0) continue;

            const variantId = item.productVariantId != null ? item.productVariantId : null;
            if (!variantId) {
                console.warn(`[orders] Order ${orderId} item بدون productVariantId — لا يتم خصم المخزون (productId=${item.productId})`);
                continue;
            }

            const variant = await client.productVariant.findUnique({
                where: { id: variantId },
                include: { product: true, color: true, size: true }
            });
            if (!variant) {
                console.warn(`[orders] Order ${orderId} variant id=${variantId} غير موجود — تخطي الخصم`);
                continue;
            }

            const newStock = Math.max(0, (variant.stock ?? 0) - qty);
            await client.productVariant.update({
                where: { id: variant.id },
                data: { stock: newStock }
            });
            if (newStock === 0) {
                const detail = [variant.color?.name, variant.size?.name].filter(Boolean).join(' / ') || 'variant';
                zeroedVariants.push({
                    productName: variant.product?.name || 'Product',
                    detail,
                    orderId: order.id
                });
            }
        }
    };

    if (db === prisma) {
        await prisma.$transaction(runDecrements);
    } else {
        await runDecrements(db);
    }

    for (const { productName, detail, orderId } of zeroedVariants) {
        try {
            await notificationsService.create({
                userId: null,
                orderId,
                title: 'Out of Stock',
                message: `Product "${productName}" (${detail}) is out of stock.`,
                type: 'ALERT'
            });
        } catch (notifErr) {
            console.error('Failed to create out-of-stock notification:', notifErr);
        }
    }

    invalidateProductsCacheForOrder(order);
};

// إرجاع مخزون الـ variant عند CANCELED / REFUNDED — يعتمد على productVariantId
const incrementStockForOrder = async (orderId, tx = null) => {
    const db = tx || prisma;
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });
    if (!order || !order.items?.length) return;

    for (const item of order.items) {
        const qty = Math.max(0, item.quantity || 0);
        if (qty <= 0) continue;

        const variantId = item.productVariantId != null ? item.productVariantId : null;
        if (!variantId) continue;

        const variant = await db.productVariant.findUnique({
            where: { id: variantId }
        });
        if (!variant) continue;

        const newStock = (variant.stock ?? 0) + qty;
        await db.productVariant.update({
            where: { id: variant.id },
            data: { stock: newStock }
        });
    }

    invalidateProductsCacheForOrder(order);
};

// Resolve variant and stock for an item (by productVariantId or productId+color+size)
const getVariantAndStock = async (item) => {
    const variantId = item.productVariantId != null ? item.productVariantId : null;
    if (variantId) {
        const v = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: { product: true, color: true, size: true }
        });
        if (!v) throw new Error(`Variant ${variantId} not found`);
        return { variant: v, stock: v.stock ?? 0 };
    }
    const productId = item.productId;
    const colorName = (item.color || '').toString().trim();
    const sizeName = (item.size || '').toString().trim();
    const v = await prisma.productVariant.findFirst({
        where: {
            productId,
            ...(colorName && { color: { name: colorName } }),
            ...(sizeName && { size: { name: sizeName } })
        },
        include: { product: true, color: true, size: true }
    });
    if (!v) return { variant: null, stock: 0 };
    return { variant: v, stock: v.stock ?? 0 };
};

// Create Order (Transactional)
// itemsData = [{ productId, quantity, price?, color?, size?, productVariantId? }] – price from cart (variant) when sent
exports.create = async (userId, itemsData, additionalData = {}) => {
    const productIds = itemsData.map(i => i.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
            category: { select: { exchangeRateToEgp: true, currencyCode: true } },
            variants: { take: 1, orderBy: { id: 'asc' } }
        }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of itemsData) {
        const productId = item.productId;
        const product = productMap.get(productId);
        if (!product) {
            throw new Error(`Product ${item.productId} not found`);
        }
        if (!product.isActive) {
            throw new Error(`Product ${product.name} is not active`);
        }

        const { variant, stock } = await getVariantAndStock(item);
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        if (stock < qty) {
            const detail = variant ? [variant.color?.name, variant.size?.name].filter(Boolean).join(' / ') || product.name : product.name;
            throw new Error(`Only ${stock} in stock for ${product.name}${detail ? ` (${detail})` : ''}`);
        }

        // لازم نعرف الـ variant لكل بند عشان نخصم المخزون لما الطلب يتأكد — لو المنتج فيه variants ومفيش variant محدّد نرفض
        const variantsCount = product.variants?.length ?? 0;
        if (variantsCount > 0 && !variant) {
            throw new Error(`يجب تحديد اللون/الحجم أو productVariantId للمنتج "${product.name}" (productId=${productId})`);
        }

        const rawPrice = Number(variant?.price ?? product.basePrice ?? product.variants?.[0]?.price ?? 0);
        const egpRate = resolveCategoryRateToEgp(product);
        const price = round2(rawPrice * egpRate);
        const itemTotal = price * qty;
        subtotal += itemTotal;

        const itemData = {
            productId: product.id,
            productName: product.name,
            quantity: qty,
            priceAtPurchase: price,
            color: item.color || null,
            size: item.size || null
        };
        if (variant) itemData.productVariantId = variant.id;
        orderItemsData.push(itemData);
    }

    const shippingFee = Number(additionalData.shippingFee) || 0;
    const discount = Number(additionalData.discount) || 0;
    const totalAmount = Math.max(0, subtotal + shippingFee - discount);
    const totals = calculateDualCurrencyTotals(totalAmount, 50);

    return prisma.$transaction(async (tx) => {
        if (additionalData.couponCode) {
            await tx.coupon.update({
                where: { code: additionalData.couponCode.toUpperCase() },
                data: { usageCount: { increment: 1 } }
            });
        }

        const orderData = {
            user: { connect: { id: userId } },
            status: 'PENDING',
            subtotal,
            shippingFee,
            discount,
            totalAmount,
            totalAmountEgp: totals.totalAmountEgp,
            totalAmountUsd: totals.totalAmountUsd,
            exchangeRateUsdToEgp: totals.exchangeRateUsdToEgp,
            paymentMethod: additionalData.paymentMethod || 'COD',
            notes: additionalData.notes || null,
            billingInfo: additionalData.billingInfo || null,
            shippingAddress: additionalData.shippingAddress || null,
            phone: additionalData.phone || null,
            items: {
                create: orderItemsData
            }
        };

        return tx.order.create({
            data: orderData,
            include: {
                items: {
                    include: { product: true }
                }
            }
        });
    });
};

const productIncludeWithImage = {
    include: {
        colorImages: { include: { color: true }, orderBy: { order: 'asc' } }
    }
};

// Find All Orders (with scope filtering)
exports.findAll = async (where = {}, itemWhere = {}) => {
    return prisma.order.findMany({
        where,
        include: {
            user: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            items: {
                where: itemWhere,
                include: { product: productIncludeWithImage }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

// Find One Order (attach productVariant/stock per item so frontend gets stock)
exports.findOne = async (id, itemWhere = {}) => {
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, firstName: true, lastName: true, email: true }
            },
            items: {
                where: itemWhere,
                include: { product: productIncludeWithImage }
            }
        }
    });
    if (!order) return null;
    const variantIds = [...new Set(order.items.map(i => i.productVariantId).filter(Boolean))];
    const variants = variantIds.length
        ? await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, stock: true }
        })
        : [];
    const variantMap = new Map(variants.map(v => [v.id, v]));
    order.items = order.items.map(item => {
        const productVariant = item.productVariantId ? variantMap.get(item.productVariantId) : null;
        return { ...item, productVariant: productVariant || null };
    });
    return order;
};

const ALLOWED_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED', 'REFUNDED', 'COMPLETED', 'CANCELED'];

// Statuses where stock was already deducted (CONFIRMED/PAID and after, until REFUNDED/COMPLETED)
const STATUSES_WITH_STOCK_DEDUCTED = ['CONFIRMED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED'];

exports.updateStatus = async (id, status, cancelReason = null, returnReason = null) => {
    const orderId = id;
    const statusVal = status != null ? String(status).toUpperCase().trim() : '';
    if (!statusVal || !ALLOWED_ORDER_STATUSES.includes(statusVal)) {
        throw new Error(`Invalid status. Allowed: ${ALLOWED_ORDER_STATUSES.join(', ')}`);
    }

    const existing = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, paymentMethod: true, totalAmount: true }
    });
    if (!existing) throw new Error('Order not found');

    const existingStatus = String(existing.status || '').toUpperCase().trim();

    // Cash on Delivery (COD): الفلوس تُسجّل فقط عند DELIVERED
    if (statusVal === 'DELIVERED' && existing.paymentMethod === 'COD') {
        const hasCodPayment = await prisma.payment.findFirst({
            where: { orderId, provider: 'COD', status: 'SUCCESS' }
        });
        if (!hasCodPayment) {
            await prisma.payment.create({
                data: {
                    orderId,
                    provider: 'COD',
                    status: 'SUCCESS',
                    amount: existing.totalAmount ?? 0
                }
            });
        }
    }

    const shouldDecrement = (statusVal === 'CONFIRMED' || statusVal === 'PAID' || statusVal === 'PROCESSING') && !STATUSES_WITH_STOCK_DEDUCTED.includes(existingStatus);
    const hadStockDeducted = STATUSES_WITH_STOCK_DEDUCTED.includes(existingStatus);
    const shouldIncrementRefunded = statusVal === 'REFUNDED' && hadStockDeducted;
    const shouldIncrementCanceled = statusVal === 'CANCELED' && hadStockDeducted;

    const updateData = {
        status: statusVal,
        cancelReason: statusVal === 'CANCELED' ? (cancelReason || null) : null
    };
    if (statusVal === 'RETURNED' || statusVal === 'REFUNDED') {
        updateData.returnReason = returnReason != null ? returnReason : null;
    }
    if (statusVal === 'DELIVERED' && existingStatus !== 'DELIVERED') {
        updateData.deliveredAt = new Date();
    }

    // خصم المخزون خارج الـ transaction حتى يُحفظ في الداتابيز فوراً (لو داخل transaction وحدث خطأ في order.update يُتراجع كل شيء)
    if (shouldDecrement) {
        await decrementStockForOrder(orderId, null);
    }

    const runOrderUpdate = async (client) => {
        if (shouldIncrementRefunded) await incrementStockForOrder(orderId, client);
        if (shouldIncrementCanceled) await incrementStockForOrder(orderId, client);
        return client.order.update({
            where: { id: orderId },
            data: updateData
        });
    };

    try {
        return await prisma.$transaction((tx) => runOrderUpdate(tx));
    } catch (err) {
        if (shouldDecrement) {
            try {
                await incrementStockForOrder(orderId, null);
            } catch (rollbackErr) {
                console.error('[orders] Rollback stock after order update failed:', rollbackErr);
            }
        }
        const msg = err.message || '';
        if (msg.includes('returnReason') || msg.includes('Unknown column') || msg.includes('deliveredAt')) {
            delete updateData.returnReason;
            delete updateData.deliveredAt;
            return prisma.$transaction((tx) => runOrderUpdate(tx));
        }
        throw err;
    }
};

exports.updateOrderDetails = async (id, data) => {
    return prisma.order.update({
        where: { id },
        data: {
            phone: data.phone,
            notes: data.notes,
            shippingAddress: data.shippingAddress,
            billingInfo: data.billingInfo
        }
    });
};

exports.updateOrderItems = async (id, items) => {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Order not found');

    const createPayload = [];
    for (const item of items) {
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const { variant, stock } = await getVariantAndStock(item);
        if (stock < qty) {
            const name = item.productName || 'Product';
            const detail = variant ? [variant.color?.name, variant.size?.name].filter(Boolean).join(' / ') : '';
            throw new Error(`Only ${stock} in stock for ${name}${detail ? ` (${detail})` : ''}`);
        }
        const row = {
            productId: item.productId,
            productName: item.productName || 'Product',
            quantity: qty,
            priceAtPurchase: item.priceAtPurchase,
            color: item.color || null,
            size: item.size || null
        };
        if (variant) row.productVariantId = variant.id;
        createPayload.push(row);
    }

    const subtotal = createPayload.reduce((sum, item) => sum + (Number(item.priceAtPurchase) * item.quantity), 0);
    const totalAmount = subtotal + Number(order.shippingFee) - Number(order.discount);
    const rate = Number(order.exchangeRateUsdToEgp) > 0
        ? Number(order.exchangeRateUsdToEgp)
        : 50;
    const totals = calculateDualCurrencyTotals(totalAmount, rate);

    return prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        return tx.order.update({
            where: { id },
            data: {
                subtotal,
                totalAmount,
                totalAmountEgp: totals.totalAmountEgp,
                totalAmountUsd: totals.totalAmountUsd,
                exchangeRateUsdToEgp: totals.exchangeRateUsdToEgp,
                items: { create: createPayload }
            },
            include: {
                items: { include: { product: true } }
            }
        });
    });
};

// Customer requests return: only within 24h of delivery; after 24h no longer allowed
const RETURN_WINDOW_HOURS = 24;

exports.requestReturnByCustomer = async (orderId, userId, returnReason = null) => {
    const id = orderId;
    const order = await prisma.order.findUnique({
        where: { id },
        select: { id: true, userId: true, status: true, updatedAt: true }
    });
    if (!order) throw new Error('Order not found');
    if (order.userId !== userId) throw new Error('Access denied');
    if (order.status !== 'DELIVERED') {
        throw new Error('Return can only be requested for delivered orders');
    }
    // Use updatedAt as delivery time (deliveredAt may not exist in DB yet; when it does, include it in select and use it here)
    const deliveredAt = order.updatedAt ? new Date(order.updatedAt) : null;
    if (!deliveredAt) {
        throw new Error('Delivery date is not recorded; contact support');
    }
    const now = new Date();
    const hoursSinceDelivery = (now - deliveredAt) / (1000 * 60 * 60);
    if (hoursSinceDelivery > RETURN_WINDOW_HOURS) {
        throw new Error('Return can only be requested within 24 hours of delivery. The return period has ended.');
    }
    return exports.updateStatus(id, 'RETURNED', null, returnReason || 'Return requested by customer');
};

// Mark a batch of orders as fulfilled (e.g. after the admin completes the next.co.uk checkout
// for a merged push). Independent of OrderStatus — does not touch stock or payment state.
// Idempotent: orders that already have fulfilledAt set are not overwritten.
exports.markFulfilled = async (orderIds, userId) => {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw new Error('orderIds is required and must contain at least one order');
    }
    const uniqueIds = Array.from(new Set(orderIds.filter(id => typeof id === 'string' && id.length > 0)));
    if (uniqueIds.length === 0) {
        throw new Error('orderIds is required and must contain at least one order');
    }

    const existing = await prisma.order.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, fulfilledAt: true }
    });
    const foundIds = new Set(existing.map(o => o.id));
    const missing = uniqueIds.filter(id => !foundIds.has(id));
    if (missing.length) {
        const err = new Error(`Order(s) not found: ${missing.join(', ')}`);
        err.statusCode = 404;
        throw err;
    }

    // Idempotent: only flip the ones that aren't already fulfilled.
    const toFlip = existing.filter(o => !o.fulfilledAt).map(o => o.id);
    const fulfilledAt = new Date();
    if (toFlip.length) {
        await prisma.order.updateMany({
            where: { id: { in: toFlip } },
            data: { fulfilledAt, fulfilledBy: userId || null }
        });
    }
    return {
        fulfilledAt: fulfilledAt.toISOString(),
        count: toFlip.length,
        skipped: uniqueIds.length - toFlip.length
    };
};

// Delete Order (with all related records: payments, notifications, items, then order)
exports.deleteOrder = async (id) => {
    const orderId = id;
    return prisma.$transaction(async (tx) => {
        await tx.payment.deleteMany({ where: { orderId } });
        await tx.orderItem.deleteMany({ where: { orderId } });
        try {
            await tx.notification.deleteMany({ where: { orderId } });
        } catch (_) {
            try {
                await tx.notification.updateMany({ where: { orderId }, data: { orderId: null } });
            } catch (__) { }
        }
        return tx.order.delete({ where: { id: orderId } });
    });
};
