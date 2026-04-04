/**
 * Normalizes an image URL to ensure it has the correct protocol and path.
 * Especially useful for fixing legacy production data or incorrect host detection.
 */
exports.normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;

    const baseUrl = process.env.BACKEND_URL || 'http://tovo-b.developteam.site/kids';
    const prodHost = 'tovo-b.developteam.site';

    // 1. Handle relative uploads path -> prefix with baseUrl
    if (url.startsWith('/uploads/')) {
        return `${baseUrl}${url}`;
    }

    // 2. Handle missing /kids/ in specific host
    let normalized = url.trim();
    if (normalized.includes(prodHost) && !normalized.includes('/kids/')) {
        normalized = normalized.replace('/uploads/', '/kids/uploads/');
    }

    // 3. Ensure the protocol matches baseUrl if it's the same host
    if (normalized.includes(prodHost)) {
        const targetProtocol = baseUrl.startsWith('https') ? 'https://' : 'http://';
        const currentProtocol = normalized.startsWith('https') ? 'https://' : 'http://';
        if (targetProtocol !== currentProtocol) {
            normalized = normalized.replace(currentProtocol, targetProtocol);
        }
    }

    return normalized;
};

/**
 * Normalizes an array of image URLs.
 */
exports.normalizeImageUrls = (urls) => {
    if (!Array.isArray(urls)) return urls;
    return urls.map(this.normalizeImageUrl);
};
