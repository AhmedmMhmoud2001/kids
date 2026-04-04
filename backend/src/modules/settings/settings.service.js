const prisma = require('../../config/db');
const CURRENCY_KEYS = ['currency_code', 'currency_symbol', 'currency_locale'];

exports.getSetting = async (key) => {
    return prisma.setting.findUnique({
        where: { key }
    });
};

exports.upsertSetting = async (key, value) => {
    return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
    });
};

exports.getAllSettings = async () => {
    return prisma.setting.findMany();
};

const SOCIAL_KEYS = ['social_facebook_url', 'social_instagram_url', 'social_twitter_url', 'social_youtube_url'];

/** Get social links for store footer (public). Returns { facebook, instagram, twitter, youtube }. */
exports.getSocialLinks = async () => {
    const rows = await prisma.setting.findMany({
        where: { key: { in: SOCIAL_KEYS } }
    });
    const map = new Map(rows.map(r => [r.key, r.value || '']));
    return {
        facebook: map.get('social_facebook_url') || '',
        instagram: map.get('social_instagram_url') || '',
        twitter: map.get('social_twitter_url') || '',
        youtube: map.get('social_youtube_url') || ''
    };
};

/** Update social links (admin). payload: { facebook?, instagram?, twitter?, youtube? } */
exports.updateSocialLinks = async (payload) => {
    const updates = [
        ['social_facebook_url', payload.facebook],
        ['social_instagram_url', payload.instagram],
        ['social_twitter_url', payload.twitter],
        ['social_youtube_url', payload.youtube]
    ].filter(([, v]) => v !== undefined);
    for (const [key, value] of updates) {
        await prisma.setting.upsert({
            where: { key },
            update: { value: String(value ?? '').trim() },
            create: { key, value: String(value ?? '').trim() }
        });
    }
    return exports.getSocialLinks();
};

/** Get currency settings for storefront/admin display. */
exports.getCurrencySettings = async () => {
    const rows = await prisma.setting.findMany({
        where: { key: { in: CURRENCY_KEYS } }
    });
    const map = new Map(rows.map(r => [r.key, r.value || '']));
    return {
        code: (map.get('currency_code') || 'EGP').toUpperCase(),
        symbol: map.get('currency_symbol') || 'EGP',
        locale: map.get('currency_locale') || 'en-EG'
    };
};

/** Update currency settings. payload: { code?, symbol?, locale? } */
exports.updateCurrencySettings = async (payload) => {
    const updates = [
        ['currency_code', payload.code ? String(payload.code).trim().toUpperCase() : undefined],
        ['currency_symbol', payload.symbol !== undefined ? String(payload.symbol).trim() : undefined],
        ['currency_locale', payload.locale !== undefined ? String(payload.locale).trim() : undefined]
    ].filter(([, v]) => v !== undefined && v !== '');

    for (const [key, value] of updates) {
        await prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
    }

    return exports.getCurrencySettings();
};
