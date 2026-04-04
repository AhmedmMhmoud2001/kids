const settingsService = require('./settings.service');

exports.getSocialLinks = async (req, res) => {
    try {
        const data = await settingsService.getSocialLinks();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSocialLinks = async (req, res) => {
    try {
        const { facebook, instagram, twitter, youtube } = req.body || {};
        const data = await settingsService.updateSocialLinks({ facebook, instagram, twitter, youtube });
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getCurrencySettings = async (req, res) => {
    try {
        const data = await settingsService.getCurrencySettings();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCurrencySettings = async (req, res) => {
    try {
        const { code, symbol, locale } = req.body || {};
        const data = await settingsService.updateCurrencySettings({ code, symbol, locale });
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAllSettings = async (req, res) => {
    try {
        const settings = await settingsService.getAllSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSettingByKey = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await settingsService.getSetting(key);
        res.json({ success: true, data: setting });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ message: 'Key is required' });

        const setting = await settingsService.upsertSetting(key, value);
        res.json({ success: true, data: setting });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
