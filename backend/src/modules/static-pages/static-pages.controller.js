const staticPageService = require('./static-pages.service');

exports.findAll = async (req, res) => {
    try {
        const pages = await staticPageService.findAll();
        res.json({ success: true, data: pages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.findOne = async (req, res) => {
    try {
        const page = await staticPageService.findOne(req.params.idOrSlug);
        if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
        res.json({ success: true, data: page });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const page = await staticPageService.update(req.params.id, req.body);
        res.json({ success: true, data: page });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const page = await staticPageService.create(req.body);
        res.status(201).json({ success: true, data: page });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await staticPageService.delete(req.params.id);
        res.json({ success: true, message: 'Page deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
