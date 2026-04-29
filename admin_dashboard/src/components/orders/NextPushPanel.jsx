import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, ExternalLink, CheckCircle2, AlertTriangle, XCircle, Loader2, Check } from 'lucide-react';
import { startNextPush, getNextPushHistory, markOrdersFulfilled } from '../../api/orders';

/**
 * "Push to next.co.uk" button + inline progress panel for the order detail modal.
 *
 * Flow:
 *  1. Admin clicks Push → we call POST /orders/:id/next-push/start to enqueue log rows
 *     and get back { correlationId, items }.
 *  2. We window.postMessage the payload on this tab. The browser extension's content
 *     script listens on the admin dashboard origin and relays to its background worker,
 *     which opens one tab per item on next.co.uk and automates the add-to-bag flow.
 *  3. The extension posts each result back via the kids-master API (credentials: include).
 *     We poll /orders/:id/next-push to reflect status changes inline.
 *
 * Visible only to SYSTEM_ADMIN / ADMIN_NEXT. Disabled if any NEXT item is missing sourceUrl.
 */
export default function NextPushPanel({ order, userRole, onAfterFulfill }) {
    const canSeeButton = userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN_NEXT';
    const canFulfill =
        userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN_NEXT' || userRole === 'ADMIN_KIDS';

    // Filter to NEXT items up front so UI math is consistent.
    const nextItems = useMemo(
        () => (order?.items || []).filter(it => it?.product?.audience === 'NEXT'),
        [order]
    );
    const missingSourceUrl = nextItems.filter(it => !it?.product?.sourceUrl);
    const hasNextItems = nextItems.length > 0;
    const canPush = hasNextItems && missingSourceUrl.length === 0;

    const [pushing, setPushing] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]); // [{ correlationId, createdAt, items: [...] }]
    const [activeCorrelationId, setActiveCorrelationId] = useState(null);
    const [fulfilling, setFulfilling] = useState(false);
    const [localFulfilledAt, setLocalFulfilledAt] = useState(order?.fulfilledAt || null);
    const [localFulfilledBy, setLocalFulfilledBy] = useState(order?.fulfilledBy || null);

    // Stay in sync if the parent reloads the order (e.g. after the modal reopens).
    useEffect(() => {
        setLocalFulfilledAt(order?.fulfilledAt || null);
        setLocalFulfilledBy(order?.fulfilledBy || null);
    }, [order?.fulfilledAt, order?.fulfilledBy]);

    // Load history when the modal opens or the active order changes.
    useEffect(() => {
        if (!order?.id || !canSeeButton || !hasNextItems) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getNextPushHistory(order.id);
                if (!cancelled && res?.success) setHistory(res.data || []);
            } catch (_err) {
                // History is advisory; silent fallback is fine.
            }
        })();
        return () => { cancelled = true; };
    }, [order?.id, canSeeButton, hasNextItems]);

    // Poll while a run is active — every 2s until all items are non-QUEUED.
    useEffect(() => {
        if (!activeCorrelationId || !order?.id) return undefined;
        const timer = setInterval(async () => {
            try {
                const res = await getNextPushHistory(order.id);
                if (res?.success) {
                    setHistory(res.data || []);
                    const run = (res.data || []).find(r => r.correlationId === activeCorrelationId);
                    if (run && run.items.every(i => i.status !== 'QUEUED')) {
                        setActiveCorrelationId(null);
                    }
                }
            } catch (_err) {
                // Keep polling; transient errors shouldn't cancel the run.
            }
        }, 2000);
        // Hard cap polling at 3 minutes so we don't spin forever if the extension is gone.
        const safety = setTimeout(() => setActiveCorrelationId(null), 180000);
        return () => { clearInterval(timer); clearTimeout(safety); };
    }, [activeCorrelationId, order?.id]);

    // Fast-path: listen for result/done messages from the extension so the UI updates
    // without waiting for the next poll tick.
    useEffect(() => {
        if (!activeCorrelationId) return undefined;
        const handler = async (ev) => {
            if (ev.source !== window) return;
            if (ev.origin !== window.location.origin) return;
            const data = ev.data;
            if (!data || typeof data !== 'object') return;
            if (data.type !== 'NEXT_CART_PUSH_RESULT' && data.type !== 'NEXT_CART_PUSH_DONE') return;
            if (data.correlationId && data.correlationId !== activeCorrelationId) return;
            try {
                const res = await getNextPushHistory(order.id);
                if (res?.success) setHistory(res.data || []);
            } catch (_err) { /* swallowed; poll timer is the safety net */ }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [activeCorrelationId, order?.id]);

    const handlePush = async () => {
        if (!canPush || pushing) return;
        setError(null);
        setPushing(true);
        try {
            const res = await startNextPush(order.id);
            const correlationId = res?.data?.correlationId;
            const items = res?.data?.items || [];
            if (!correlationId) throw new Error('Push did not return a correlationId');

            window.postMessage(
                {
                    type: 'NEXT_CART_PUSH',
                    version: 1,
                    correlationId,
                    orderId: order.id,
                    dashboardOrigin: window.location.origin,
                    items
                },
                window.location.origin
            );

            // Refresh history immediately so the QUEUED rows render.
            const hist = await getNextPushHistory(order.id);
            if (hist?.success) setHistory(hist.data || []);
            setActiveCorrelationId(correlationId);
        } catch (err) {
            setError(err?.message || 'Failed to start push');
        } finally {
            setPushing(false);
        }
    };

    const handleFulfill = async () => {
        if (!canFulfill || fulfilling || localFulfilledAt) return;
        setError(null);
        setFulfilling(true);
        try {
            const res = await markOrdersFulfilled([order.id]);
            const stamp = res?.data?.fulfilledAt || new Date().toISOString();
            setLocalFulfilledAt(stamp);
            // userId isn't returned, but we know it's the current user; the backend sets it.
            if (onAfterFulfill) onAfterFulfill(order.id, stamp);
        } catch (err) {
            setError(err?.message || 'Failed to mark fulfilled');
        } finally {
            setFulfilling(false);
        }
    };

    if (!canSeeButton || !hasNextItems) return null;

    const activeRun = history.find(r => r.correlationId === activeCorrelationId);
    const latestRun = activeRun || history[0];

    return (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <ShoppingBag size={18} className="text-indigo-600" />
                    <div>
                        <div className="text-sm font-semibold text-gray-900">Push to next.co.uk</div>
                        <div className="text-xs text-gray-500">Sends {nextItems.length} item{nextItems.length === 1 ? '' : 's'} to the Next Cart extension.</div>
                        {localFulfilledAt && (
                            <div className="mt-1 text-[11px] text-green-700 font-medium inline-flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                Fulfilled at {new Date(localFulfilledAt).toLocaleString()}
                                {localFulfilledBy ? ` by ${localFulfilledBy}` : ''}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {canFulfill && (
                        <button
                            type="button"
                            onClick={handleFulfill}
                            disabled={fulfilling || !!localFulfilledAt}
                            title={localFulfilledAt
                                ? 'Already marked fulfilled'
                                : 'Mark this order as fulfilled (e.g. after completing the next.co.uk checkout)'}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {fulfilling ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            {localFulfilledAt ? 'Fulfilled' : 'Mark fulfilled'}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handlePush}
                        disabled={!canPush || pushing || !!activeCorrelationId}
                        title={!canPush
                            ? `Missing next.co.uk URL on: ${missingSourceUrl.map(it => it.product?.name || it.productName || it.productId).join(', ')}`
                            : 'Requires the Next Cart extension installed'}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {pushing || activeCorrelationId ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                        {activeCorrelationId ? 'Pushing…' : 'Push to next.co.uk'}
                    </button>
                </div>
            </div>

            {!canPush && missingSourceUrl.length > 0 && (
                <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <div className="font-semibold flex items-center gap-1 mb-1"><AlertTriangle size={14} /> Missing next.co.uk URL</div>
                    Open each product and paste its next.co.uk URL before pushing:
                    <ul className="list-disc pl-5 mt-1 space-y-0.5">
                        {missingSourceUrl.map((it, i) => (
                            <li key={i}>{it.product?.name || it.productName || it.productId}</li>
                        ))}
                    </ul>
                </div>
            )}

            {error && (
                <div className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">{error}</div>
            )}

            {latestRun && (
                <div className="mt-3">
                    <div className="text-xs font-semibold text-gray-700 mb-1">
                        {activeCorrelationId ? 'Current push' : 'Last push'} · {new Date(latestRun.createdAt).toLocaleString()}
                    </div>
                    <div className="rounded-md border border-gray-200 bg-white divide-y divide-gray-100">
                        {latestRun.items.map((it) => {
                            const orderItem = nextItems.find(oi => oi.id === it.orderItemId);
                            const label = orderItem?.product?.name || orderItem?.productName || it.orderItemId.slice(0, 8);
                            const showMessage = it.message && (it.status === 'FAILED' || it.status === 'UNAVAILABLE');
                            return (
                                <div key={it.orderItemId} className="px-3 py-2 text-xs">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="truncate">{label}</div>
                                        <StatusPill status={it.status} message={it.message} />
                                    </div>
                                    {showMessage && (
                                        <div className={`mt-1 text-[11px] ${it.status === 'FAILED' ? 'text-red-700' : 'text-amber-700'}`}>
                                            {it.message}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusPill({ status, message }) {
    const map = {
        QUEUED: { label: 'Queued', cls: 'bg-gray-100 text-gray-700', Icon: Loader2, spin: true },
        ADDED: { label: 'Added', cls: 'bg-green-100 text-green-800', Icon: CheckCircle2 },
        UNAVAILABLE: { label: 'Unavailable', cls: 'bg-amber-100 text-amber-800', Icon: AlertTriangle },
        FAILED: { label: 'Failed', cls: 'bg-red-100 text-red-800', Icon: XCircle }
    };
    const cfg = map[status] || map.QUEUED;
    const Icon = cfg.Icon;
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}
            title={message || undefined}
        >
            <Icon size={12} className={cfg.spin ? 'animate-spin' : ''} />
            {cfg.label}
        </span>
    );
}
