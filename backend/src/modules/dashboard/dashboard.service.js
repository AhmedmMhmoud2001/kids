const prisma = require('../../config/db');

exports.getStats = async (audience) => {
    // 1. Total Revenue — حسب طريقة الدفع: فيزا (CARD) = CONFIRMED/PROCESSING/SHIPPED/DELIVERED/COMPLETED/RETURNED تضاف الفلوس، الدفع عند التوصيل (COD) = الفلوس تضاف فقط عند DELIVERED/COMPLETED/RETURNED
    const revenueWhere = {
        OR: [
            { paymentMethod: 'CARD', status: { in: ['CONFIRMED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'RETURNED'] } },
            { paymentMethod: 'COD', status: { in: ['DELIVERED', 'COMPLETED', 'RETURNED'] } }
        ],
        ...(audience ? { items: { some: { product: { audience } } } } : {})
    };
    const ordersRes = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: revenueWhere
    });
    const totalSales = Number(ordersRes._sum.totalAmount || 0);

    // 2. Count Active Orders (PENDING, CONFIRMED, SHIPPED — not yet delivered)
    const activeOrdersCount = await prisma.order.count({
        where: {
            items: audience ? { some: { product: { audience } } } : undefined,
            status: { in: ['PENDING', 'CONFIRMED', 'SHIPPED'] }
        }
    });

    // 3. Count Products
    const productsCount = await prisma.product.count({
        where: {
            audience: audience || undefined,
            isActive: true
        }
    });

    // 4. Count Users (Total Customers)
    const usersCount = await prisma.user.count({
        where: { role: 'CUSTOMER' }
    });

    // 5. Count Categories
    const categoriesCount = await prisma.category.count({
        where: audience ? { audience } : undefined
    });

    // 6. Count Brands
    const brandsCount = await prisma.brand.count();

    // 7. Count Active Coupons
    const couponsCount = await prisma.coupon.count({
        where: { isActive: true }
    });

    // 5. Get Chart Data (Last 6 Months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesChartData = [];
    const ordersChartStats = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthIndex = d.getMonth();
        const year = d.getFullYear();

        const startDate = new Date(year, monthIndex, 1);
        const endDate = new Date(year, monthIndex + 1, 0);

        const monthlyRevenue = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: {
                createdAt: { gte: startDate, lte: endDate },
                OR: [
                    { paymentMethod: 'CARD', status: { in: ['CONFIRMED', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'RETURNED'] } },
                    { paymentMethod: 'COD', status: { in: ['DELIVERED', 'COMPLETED', 'RETURNED'] } }
                ],
                ...(audience ? { items: { some: { product: { audience } } } } : {})
            }
        });

        const monthlyOrders = await prisma.order.count({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                items: audience ? { some: { product: { audience } } } : undefined
            }
        });

        salesChartData.push({
            name: months[monthIndex],
            value: Number(monthlyRevenue._sum.totalAmount || 0)
        });

        ordersChartStats.push({
            name: months[monthIndex],
            orders: monthlyOrders
        });
    }

    return {
        sales: totalSales,
        activeOrders: activeOrdersCount,
        products: productsCount,
        totalUsers: usersCount,
        categories: categoriesCount,
        brands: brandsCount,
        coupons: couponsCount,
        salesData: salesChartData,
        ordersStats: ordersChartStats
    };
};
