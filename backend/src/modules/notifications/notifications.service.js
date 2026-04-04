const prisma = require('../../config/db');
const { emitToAdmins, emitToUser } = require('../../config/socket');

exports.create = async (data) => {
    const notification = await prisma.notification.create({
        data
    });

    // Emit real-time notification
    if (!notification.userId) {
        // Broadcast to all admins
        emitToAdmins('new_notification', notification);
    } else {
        // Send to specific user
        emitToUser(notification.userId, 'new_notification', notification);
    }

    return notification;
};

exports.findAll = async (skip = 0, take = 20) => {
    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            skip: parseInt(skip),
            take: parseInt(take)
        }),
        prisma.notification.count()
    ]);

    return {
        notifications,
        total,
        hasMore: skip + take < total
    };
};

exports.markAsRead = async (id) => {
    return prisma.notification.update({
        where: { id },
        data: { isRead: true }
    });
};

exports.markAllAsRead = async () => {
    return prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true }
    });
};

exports.deleteById = async (id) => {
    return prisma.notification.delete({
        where: { id }
    });
};
