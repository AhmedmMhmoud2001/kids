const couponsService = require('./coupons.service');

// GET /api/coupons
exports.getAllCoupons = async (req, res, next) => {
    try {
        const coupons = await couponsService.findAll();
        res.json({
            success: true,
            data: coupons,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/coupons/:id
exports.getCouponById = async (req, res, next) => {
    try {
        const coupon = await couponsService.findOne(req.params.id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }

        res.json({
            success: true,
            data: coupon,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/coupons
exports.createCoupon = async (req, res, next) => {
    try {
        const {
            code,
            type,
            value,
            minOrderAmount,
            maxDiscount,
            usageLimit,
            expiresAt,
            isActive,
        } = req.body;

        if (!code || !type || value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'code, type and value are required',
            });
        }

        const couponData = {
            code: String(code).toUpperCase(),
            type,
            value: parseFloat(value),
            minOrderAmount: minOrderAmount !== null && minOrderAmount !== undefined && minOrderAmount !== ''
                ? parseFloat(minOrderAmount)
                : null,
            maxDiscount: maxDiscount !== null && maxDiscount !== undefined && maxDiscount !== ''
                ? parseFloat(maxDiscount)
                : null,
            usageLimit: usageLimit !== null && usageLimit !== undefined && usageLimit !== ''
                ? parseInt(usageLimit, 10)
                : null,
            isActive: typeof isActive === 'boolean' ? isActive : true,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
        };

        const created = await couponsService.create(couponData);

        res.status(201).json({
            success: true,
            data: created,
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists',
            });
        }
        next(error);
    }
};

// PUT /api/coupons/:id
exports.updateCoupon = async (req, res, next) => {
    try {
        const {
            code,
            type,
            value,
            minOrderAmount,
            maxDiscount,
            usageLimit,
            expiresAt,
            isActive,
        } = req.body;

        const existing = await couponsService.findOne(req.params.id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }

        const couponData = {
            code: code ? String(code).toUpperCase() : existing.code,
            type: type || existing.type,
            value: value !== undefined ? parseFloat(value) : existing.value,
            minOrderAmount: minOrderAmount !== undefined
                ? (minOrderAmount === null || minOrderAmount === ''
                    ? null
                    : parseFloat(minOrderAmount))
                : existing.minOrderAmount,
            maxDiscount: maxDiscount !== undefined
                ? (maxDiscount === null || maxDiscount === ''
                    ? null
                    : parseFloat(maxDiscount))
                : existing.maxDiscount,
            usageLimit: usageLimit !== undefined
                ? (usageLimit === null || usageLimit === ''
                    ? null
                    : parseInt(usageLimit, 10))
                : existing.usageLimit,
            isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
            expiresAt: expiresAt !== undefined
                ? (expiresAt ? new Date(expiresAt) : null)
                : existing.expiresAt,
        };

        const updated = await couponsService.update(req.params.id, couponData);

        res.json({
            success: true,
            data: updated,
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists',
            });
        }
        next(error);
    }
};

// DELETE /api/coupons/:id
exports.deleteCoupon = async (req, res, next) => {
    try {
        const existing = await couponsService.findOne(req.params.id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found',
            });
        }

        await couponsService.delete(req.params.id);

        res.json({
            success: true,
            message: 'Coupon deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// VALIDATE COUPON (Public)
exports.validateCoupon = async (req, res, next) => {
    try {
        const { code, amount } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code is required',
            });
        }

        const coupon = await couponsService.findByCode(code);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid coupon code',
            });
        }

        if (!coupon.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Coupon is inactive',
            });
        }

        // Check expiration
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Coupon has expired',
            });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: 'Coupon usage limit reached',
            });
        }

        // Check minimum order amount
        if (amount && coupon.minOrderAmount && amount < coupon.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount for this coupon is ${coupon.minOrderAmount} EGP`,
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.type === 'PERCENT') {
            discount = (amount * coupon.value) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            discount = coupon.value;
        }

        res.json({
            success: true,
            message: 'Coupon validated successfully',
            data: {
                id: coupon.id,
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                discount: discount
            }
        });

    } catch (error) {
        next(error);
    }
};
