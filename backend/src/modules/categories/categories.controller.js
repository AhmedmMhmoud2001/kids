const categoryService = require('./categories.service');

exports.create = async (req, res) => {
    try {
        const { audience } = req.body;
        const userRole = req.user.role;

        // Strict Check: Admin Kids cannot create Next categories, etc.
        if (userRole === 'ADMIN_KIDS' && audience !== 'KIDS') {
            return res.status(403).json({ success: false, message: 'You can only create KIDS categories' });
        }
        if (userRole === 'ADMIN_NEXT' && audience !== 'NEXT') {
            return res.status(403).json({ success: false, message: 'You can only create NEXT categories' });
        }

        const category = await categoryService.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.findAll = async (req, res) => {
    try {
        let { audience } = req.query;
        const user = req.user;

        // Role-based filtering (if authenticated via middleware)
        if (user) {
            if (user.role === 'ADMIN_KIDS') audience = 'KIDS';
            else if (user.role === 'ADMIN_NEXT') audience = 'NEXT';
        }

        const categories = await categoryService.findAll(audience);
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.findOne = async (req, res) => {
    try {
        const category = await categoryService.findOne(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const userRole = req.user.role;

        // 1. Fetch existing category to check scope
        const existing = await categoryService.findOne(id);
        if (!existing) return res.status(404).json({ message: 'Category not found' });

        // 2. Enforce Scope
        if (userRole === 'ADMIN_KIDS' && existing.audience !== 'KIDS') {
            return res.status(403).json({ success: false, message: 'Access denied to non-KIDS category' });
        }
        if (userRole === 'ADMIN_NEXT' && existing.audience !== 'NEXT') {
            return res.status(403).json({ success: false, message: 'Access denied to non-NEXT category' });
        }

        const category = await categoryService.update(id, req.body);
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const id = req.params.id;
        const userRole = req.user.role;

        // 1. Fetch existing category to check scope
        const existing = await categoryService.findOne(id);
        if (!existing) return res.status(404).json({ message: 'Category not found' });

        // 2. Enforce Scope
        if (userRole === 'ADMIN_KIDS' && existing.audience !== 'KIDS') {
            return res.status(403).json({ success: false, message: 'Access denied to non-KIDS category' });
        }
        if (userRole === 'ADMIN_NEXT' && existing.audience !== 'NEXT') {
            return res.status(403).json({ success: false, message: 'Access denied to non-NEXT category' });
        }

        await categoryService.delete(id);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
