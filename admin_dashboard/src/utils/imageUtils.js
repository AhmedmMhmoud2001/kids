/**
 * via.placeholder.com is often unreachable (ERR_NAME_NOT_RESOLVED).
 * Replace with placehold.co which is reliable.
 */
export function getSafeImageUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.includes('via.placeholder.com')) {
        try {
            const u = new URL(url);
            const text = u.searchParams.get('text') || 'Image';
            return `https://placehold.co/600x600/e2e8f0/475569?text=${encodeURIComponent(text)}`;
        } catch {
            return 'https://placehold.co/600x600/e2e8f0/475569?text=Image';
        }
    }
    return url;
}

/** First product image: from thumbnails (legacy) or from colorImages (up to 5 per color) */
export function getProductDisplayImage(product) {
    if (!product) return null;
    const thumb = product.thumbnails;
    if (Array.isArray(thumb) && thumb.length > 0 && thumb[0]) return thumb[0];
    if (typeof thumb === 'string') {
        try {
            const arr = JSON.parse(thumb);
            if (Array.isArray(arr) && arr[0]) return arr[0];
        } catch (_) {}
    }
    const colorImages = product.colorImages || [];
    if (colorImages.length === 0) return null;
    const sorted = [...colorImages].sort((a, b) => (a.order || 0) - (b.order || 0));
    return sorted[0]?.imageUrl || null;
}

/** All product images for display: from thumbnails or from colorImages ordered */
export function getProductAllImages(product) {
    if (!product) return [];
    const thumb = product.thumbnails;
    if (Array.isArray(thumb) && thumb.length > 0) return thumb;
    if (typeof thumb === 'string') {
        try {
            const arr = JSON.parse(thumb);
            if (Array.isArray(arr)) return arr;
        } catch (_) {}
    }
    const colorImages = product.colorImages || [];
    return colorImages.sort((a, b) => (a.order || 0) - (b.order || 0)).map(ci => ci.imageUrl);
}
