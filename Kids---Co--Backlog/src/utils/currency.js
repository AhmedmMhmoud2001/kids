export const DEFAULT_CURRENCY = {
    code: 'EGP',
    symbol: 'EGP',
    locale: 'en-EG'
};

const CURRENCY_MAP = {
    EGP: { code: 'EGP', symbol: 'EGP', locale: 'en-EG' },
    USD: { code: 'USD', symbol: '$', locale: 'en-US' },
    AED: { code: 'AED', symbol: 'AED', locale: 'en-AE' },
    EUR: { code: 'EUR', symbol: 'EUR', locale: 'de-DE' }
};

export const resolveCurrencyByCode = (currencyCode) => {
    if (!currencyCode) return DEFAULT_CURRENCY;
    const code = String(currencyCode).toUpperCase().trim();
    return CURRENCY_MAP[code] || { code, symbol: code, locale: 'en-US' };
};

export const formatPrice = (amount, currency = DEFAULT_CURRENCY) => {
    const value = Number(amount || 0);
    if (Number.isNaN(value)) return `0.00 ${currency.symbol || currency.code || 'EGP'}`;

    const symbol = currency?.symbol || currency?.code || 'EGP';
    return `${value.toFixed(2)} ${symbol}`;
};
