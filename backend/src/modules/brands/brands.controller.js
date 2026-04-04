const brandService = require('./brands.service');

exports.create = async (req, res) => {
    try {
        const brand = await brandService.create(req.body);
        res.status(201).json({ success: true, data: brand });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.findAll = async (req, res) => {
    try {
        const brands = await brandService.findAll();
        res.json({ success: true, data: brands });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.findOne = async (req, res) => {
    try {
        const brand = await brandService.findOne(req.params.id);
        if (!brand) return res.status(404).json({ message: 'Brand not found' });
        res.json({ success: true, data: brand });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const brand = await brandService.update(req.params.id, req.body);
        res.json({ success: true, data: brand });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await brandService.delete(req.params.id);
        res.json({ success: true, message: 'Brand deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
