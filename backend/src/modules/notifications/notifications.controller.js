const notificationsService = require('./notifications.service');

exports.getNotifications = async (req, res) => {
    try {
        const { skip = 0, take = 20 } = req.query;
        const result = await notificationsService.findAll(skip, take);
        res.json({ 
            success: true, 
            data: result.notifications,
            total: result.total,
            hasMore: result.hasMore
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await notificationsService.markAsRead(req.params.id);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        await notificationsService.markAllAsRead();
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        await notificationsService.deleteById(req.params.id);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
