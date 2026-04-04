/**
 * Suggested product colors (English only) — same as storefront products.js.
 * Used in ProductForm for variant color picker (swatch + name).
 */
export const COLOR_NAME_TO_HEX = {
    red: '#dc2626', blue: '#2563eb', green: '#16a34a', black: '#171717', white: '#fafafa',
    pink: '#ec4899', yellow: '#eab308', orange: '#ea580c', gray: '#6b7280', grey: '#6b7280',
    purple: '#7c3aed', violet: '#7c3aed', brown: '#92400e', navy: '#1e3a8a', beige: '#d6d3d1',
    cream: '#fef3c7', gold: '#ca8a04', silver: '#9ca3af', burgundy: '#881337', teal: '#0d9488',
    lime: '#84cc16', cyan: '#06b6d4', coral: '#f43f5e', mint: '#5eead4', lavender: '#c4b5fd',
    maroon: '#9f1239', olive: '#84cc16', mustard: '#eab308', peach: '#fdba74', charcoal: '#404040',
    rose: '#f43f5e', salmon: '#fb7185', magenta: '#c026d3', indigo: '#4f46e5', sky: '#0ea5e9',
    turquoise: '#14b8a6', emerald: '#10b981', forest: '#15803d', sage: '#84cc16', 'olive green': '#65a30d',
    amber: '#f59e0b', tangerine: '#f97316', rust: '#c2410c', terracotta: '#b45309', sand: '#d6d3d1',
    ivory: '#fffff0', offwhite: '#f8fafc', snow: '#fafafa', slate: '#64748b', graphite: '#475569',
    wine: '#9f1239', plum: '#7e22ce', fuchsia: '#c026d3', lilac: '#c084fc', mauve: '#a78bfa',
    denim: '#1e40af', aqua: '#22d3ee', petrol: '#0e7490', steel: '#94a3b8', ash: '#94a3b8',
    khaki: '#737373', tan: '#d4a574', camel: '#c4a574', chocolate: '#78350f', coffee: '#6f4e37',
    honey: '#fbbf24', butter: '#fef08a', vanilla: '#fef9c3', milk: '#f8fafc', pearl: '#e2e8f0',
};

/** List of { name, hex } for dropdowns, sorted by name */
export const SUGGESTED_COLORS = Object.entries(COLOR_NAME_TO_HEX)
    .map(([name, hex]) => ({ name, hex }))
    .sort((a, b) => a.name.localeCompare(b.name));

export function getColorHex(name) {
    if (!name || typeof name !== 'string') return null;
    return COLOR_NAME_TO_HEX[name.toLowerCase().trim()] || null;
}
