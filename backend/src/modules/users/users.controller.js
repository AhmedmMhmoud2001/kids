const userService = require('./users.service');

// Only SYSTEM_ADMIN reaches these via routes, but robust checks good practice.

exports.create = async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, phone, address, city, country, image } = req.body;

        // Basic validation
        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password, and role are required' });
        }

        const user = await userService.create({ email, password, role, firstName, lastName, phone, address, city, country, image });
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        // Handle unique email error (Prisma error code P2002)
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.findAll = async (req, res) => {
    try {
        const users = await userService.findAll();
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.findOne = async (req, res) => {
    try {
        const user = await userService.findOne(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        // Prevent changing own role to something else if needed? or allow.
        // If SYSTEM_ADMIN removes their own SYSTEM_ADMIN access, that's on them.

        const user = await userService.update(req.params.id, req.body);
        res.json({ success: true, data: user });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        // Prevent self-deletion ideally
        if (req.params.id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
        }

        await userService.delete(req.params.id);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
