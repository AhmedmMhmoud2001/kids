/**
 * Disposable/Temporary Email Detection
 * Blocks fake and temporary email addresses
 */

// List of known disposable email domains
// This list includes the most common disposable email services
const DISPOSABLE_DOMAINS = new Set([
    // Most common disposable email services
    '10minutemail.com',
    '10minutemail.net',
    'tempmail.com',
    'tempmail.net',
    'temp-mail.org',
    'temp-mail.io',
    'guerrillamail.com',
    'guerrillamail.org',
    'guerrillamail.net',
    'guerrillamail.biz',
    'guerrillamail.info',
    'sharklasers.com',
    'grr.la',
    'guerrillamailblock.com',
    'mailinator.com',
    'mailinator.net',
    'mailinator.org',
    'mailinator2.com',
    'mailinater.com',
    'trashmail.com',
    'trashmail.net',
    'trashmail.org',
    'trashmail.me',
    'throwaway.email',
    'throwawaymail.com',
    'getnada.com',
    'getairmail.com',
    'yopmail.com',
    'yopmail.fr',
    'yopmail.net',
    'fakeinbox.com',
    'fakemailgenerator.com',
    'dispostable.com',
    'mailnesia.com',
    'maildrop.cc',
    'mytrashmail.com',
    'mt2009.com',
    'mt2014.com',
    'thankyou2010.com',
    'trash2009.com',
    'mailcatch.com',
    'mailexpire.com',
    'mailmoat.com',
    'spambox.us',
    'spamfree24.org',
    'spamgourmet.com',
    'spamspot.com',
    'spam4.me',
    'tempr.email',
    'tempinbox.com',
    'tempmail.de',
    'tempmailer.com',
    'tempomail.fr',
    'temporaryemail.net',
    'temporaryinbox.com',
    'tempthe.net',
    'mintemail.com',
    'mohmal.com',
    'discard.email',
    'discardmail.com',
    'spamherelots.com',
    'spamobox.com',
    'mailnull.com',
    'emailondeck.com',
    'anonymbox.com',
    'anonmails.de',
    'burnermail.io',
    'mailsac.com',
    'mailslurp.com',
    '33mail.com',
    'jetable.org',
    'emailisvalid.com',
    'binkmail.com',
    'safetymail.info',
    'dropmail.me',
    'emailfake.com',
    'fakemailgenerator.net',
    'inboxalias.com',
    'throwam.com',
    'wegwerfemail.de',
    'sofort-mail.de',
    'trashbox.eu',
    'mail-temp.com',
    'fakemail.fr',
    'nada.email',
    'emkei.cz',
    'deadfake.com',
    'fakeinformation.com',
    'generator.email',
    'crazymailing.com',
    'tempail.com',
    'armyspy.com',
    'cuvox.de',
    'dayrep.com',
    'einrot.com',
    'fleckens.hu',
    'gustr.com',
    'jourrapide.com',
    'rhyta.com',
    'superrito.com',
    'teleworm.us',
    'tempemail.net',
    'disbox.net',
    'disbox.org',
    'emailtemporario.com.br',
    'fakemail.net',
    'inboxkitten.com',
    'mailforspam.com',
    'tempsky.com',
    'emailz.ml',
    'ze.gd',
    '1secmail.com',
    '1secmail.net',
    '1secmail.org',
    'esiix.com',
    'wwjmp.com',
    'xojxe.com',
]);

// List of domains that look suspicious but should be checked
const SUSPICIOUS_PATTERNS = [
    /^temp/i,
    /^fake/i,
    /^trash/i,
    /^spam/i,
    /^throw/i,
    /^disposable/i,
    /^guerrilla/i,
    /mail.*temp/i,
    /temp.*mail/i,
    /\d{4,}mail/i, // numbers followed by mail
    /^test[0-9]+\./i,
];

// Free email providers (not disposable, but may want to flag for B2B)
const FREE_EMAIL_DOMAINS = new Set([
    'gmail.com',
    'yahoo.com',
    'yahoo.co.uk',
    'yahoo.fr',
    'hotmail.com',
    'hotmail.co.uk',
    'outlook.com',
    'outlook.co.uk',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'protonmail.com',
    'proton.me',
    'zoho.com',
    'mail.com',
    'gmx.com',
    'gmx.de',
    'yandex.com',
    'yandex.ru',
]);

/**
 * Check if email domain is disposable
 * @param {string} email 
 * @returns {object} { isDisposable, isFreeEmail, isSuspicious, domain }
 */
const checkEmailDomain = (email) => {
    if (!email || typeof email !== 'string') {
        return { isDisposable: false, isFreeEmail: false, isSuspicious: false, domain: null };
    }

    const parts = email.toLowerCase().split('@');
    if (parts.length !== 2) {
        return { isDisposable: false, isFreeEmail: false, isSuspicious: false, domain: null };
    }

    const domain = parts[1];

    // Check if domain is in disposable list
    const isDisposable = DISPOSABLE_DOMAINS.has(domain);

    // Check if domain is free email provider
    const isFreeEmail = FREE_EMAIL_DOMAINS.has(domain);

    // Check suspicious patterns
    const isSuspicious = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(domain));

    return {
        isDisposable,
        isFreeEmail,
        isSuspicious: isSuspicious && !isFreeEmail, // Don't flag free emails as suspicious
        domain
    };
};

/**
 * Check if email should be blocked
 * @param {string} email 
 * @param {object} options - { blockDisposable, blockSuspicious }
 * @returns {object} { shouldBlock, reason }
 */
const shouldBlockEmail = (email, options = {}) => {
    const { blockDisposable = true, blockSuspicious = true } = options;

    const result = checkEmailDomain(email);

    if (blockDisposable && result.isDisposable) {
        return {
            shouldBlock: true,
            reason: 'Disposable email addresses are not allowed. Please use a permanent email address.'
        };
    }

    if (blockSuspicious && result.isSuspicious) {
        return {
            shouldBlock: true,
            reason: 'This email domain appears to be temporary. Please use a permanent email address.'
        };
    }

    return { shouldBlock: false };
};

/**
 * Validate email domain exists (basic MX check simulation)
 * Note: For production, use a proper DNS MX lookup
 * @param {string} domain 
 * @returns {boolean}
 */
const isValidDomainFormat = (domain) => {
    if (!domain) return false;
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
};

module.exports = {
    checkEmailDomain,
    shouldBlockEmail,
    isValidDomainFormat,
    DISPOSABLE_DOMAINS,
    FREE_EMAIL_DOMAINS
};
