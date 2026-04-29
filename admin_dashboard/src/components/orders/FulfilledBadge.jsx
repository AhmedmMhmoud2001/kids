import React from 'react';
import { CheckCircle2 } from 'lucide-react';

// Small green pill rendered next to the order status when Order.fulfilledAt is set.
// Tooltip shows the timestamp and the admin user-id who marked it.
export default function FulfilledBadge({ fulfilledAt, fulfilledBy, className = '' }) {
    if (!fulfilledAt) return null;
    const when = new Date(fulfilledAt).toLocaleString();
    const tip = fulfilledBy
        ? `Fulfilled at ${when} by ${fulfilledBy}`
        : `Fulfilled at ${when}`;
    return (
        <span
            title={tip}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-800 ${className}`}
        >
            <CheckCircle2 size={12} />
            Fulfilled
        </span>
    );
}
