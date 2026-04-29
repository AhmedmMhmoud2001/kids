import React, { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Loader2,
    ShoppingCart,
    Check,
    X
} from 'lucide-react';
import {
    startNextPushBatch,
    getNextPushByCorrelation,
    markOrdersFulfilled
} from '../../api/orders';

// Sticky action bar: shows up when one or more orders are selected.
//   - "Push N to next.co.uk"  (only when every selected order has NEXT items with sourceUrl)
//   - "Mark N fulfilled"      (always, idempotent)
//   - "Clear"
//
// While a merged push is active, polls /next-push/correlation/:id every 2s and
// renders per-item progress beneath the bar. Reuses the same status-pill semantics
// as NextPushPanel so the visual language is consistent across single + merged pushes.
export default function BatchOrderActionBar({
    selectedIds,
    onClear,
    orders,
    userRole,
    onAfterFulfill,
    onAfterPush
}) {
    const canPushRole = userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN_NEXT';
    const canFulfillRole =
        userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN_NEXT' || userRole === 'ADMIN_KIDS';

    const selectedOrders = useMemo(
        () => selectedIds.map((id) => orders.find((o) => o.id === id)).filter(Boolean),
        [selectedIds, orders]
    );

    // Reasons each selected order can or can't be pushed.
    const pushDiagnostics = useMemo(() => selectedOrders.map((order) => {
        const nextItems = (order.items || []).filter(
            (it) => it?.product?.audience === 'NEXT'
        );
        if (nextItems.length === 0) {
            return { orderId: order.id, ok: false, reason: 'no NEXT items' };
        }
        const missing = nextItems.find((it) => !it?.product?.sourceUrl);
        if (missing) {
            return {
                orderId: order.id,
                ok: false,
                reason: `missing sourceUrl on "${missing.product?.name || missing.productName || missing.productId}"`
            };
        }
        return { orderId: order.id, ok: true };
    }), [selectedOrders]);

    const allOk = pushDiagnostics.length > 0 && pushDiagnostics.every((d) => d.ok);
    const blockedReasons = pushDiagnostics.filter((d) => !d.ok);
    const pushDisabledReason = !canPushRole
        ? 'You do not have permission to push to next.co.uk'
        : !allOk
            ? blockedReasons.map((d) => `Order ${d.orderId.slice(0, 8)}…: ${d.reason}`).join(' • ')
            : null;

    const [pushing, setPushing] = useState(false);
    const [fulfilling, setFulfilling] = useState(false);
    const [error, setError] = useState(null);
    const [activeRun, setActiveRun] = useState(null); // { correlationId, items: [...] }

    // Poll the active correlation's items every 2s until none are still QUEUED.
    useEffect(() => {
        if (!activeRun?.correlationId) return undefined;
        let stopped = false;
        const tick = async () => {
            try {
                const res = await getNextPushByCorrelation(activeRun.correlationId);
                if (stopped) return;
                if (res?.success) {
                    setActiveRun((prev) =>
                        prev && prev.correlationId === res.data.correlationId
                            ? { ...prev, items: res.data.items }
                            : prev
                    );
                    if ((res.data.items || []).every((i) => i.status !== 'QUEUED')) {
                        // Run finished — stop polling but keep the result visible.
                        stopped = true;
                        if (onAfterPush) onAfterPush();
                    }
                }
            } catch (_e) {
                // Transient errors shouldn't end the run — keep polling.
            }
        };
        const timer = setInterval(tick, 2000);
        const safety = setTimeout(() => {
            stopped = true;
            clearInterval(timer);
        }, 180000);
        // Run once immediately too.
        tick();
        return () => {
            stopped = true;
            clearInterval(timer);
            clearTimeout(safety);
        };
    }, [activeRun?.correlationId, onAfterPush]);

    const handlePush = async () => {
        if (pushDisabledReason || pushing || selectedIds.length === 0) return;
        setError(null);
        setPushing(true);
        try {
            const res = await startNextPushBatch(selectedIds);
            const correlationId = res?.data?.correlationId;
            const items = res?.data?.items || [];
            if (!correlationId) throw new Error('No correlationId returned');

            window.postMessage(
                {
                    type: 'NEXT_CART_PUSH',
                    version: 2,
                    correlationId,
                    dashboardOrigin: window.location.origin,
                    items
                },
                window.location.origin
            );
            setActiveRun({ correlationId, items: items.map((it) => ({ ...it, status: 'QUEUED' })) });
        } catch (err) {
            setError(err?.message || 'Failed to start merged push');
        } finally {
            setPushing(false);
        }
    };

    const handleFulfill = async () => {
        if (!canFulfillRole || fulfilling || selectedIds.length === 0) return;
        setError(null);
        setFulfilling(true);
        try {
            await markOrdersFulfilled(selectedIds);
            if (onAfterFulfill) onAfterFulfill(selectedIds);
            // Don't auto-clear: leave selection so the user can also push if they want.
        } catch (err) {
            setError(err?.message || 'Failed to mark orders fulfilled');
        } finally {
            setFulfilling(false);
        }
    };

    if (selectedIds.length === 0 && !activeRun) return null;

    return (
        <div className="sticky top-0 z-20 bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-3 flex flex-wrap items-center gap-3">
            {selectedIds.length > 0 && (
                <>
                    <span className="text-sm font-semibold text-blue-900">
                        {selectedIds.length} selected
                    </span>
                    <button
                        onClick={onClear}
                        className="text-xs text-blue-700 underline hover:text-blue-900"
                        type="button"
                    >
                        Clear
                    </button>

                    {canPushRole && (
                        <button
                            type="button"
                            onClick={handlePush}
                            disabled={!!pushDisabledReason || pushing || activeRun != null}
                            title={pushDisabledReason || 'Push selected orders to next.co.uk'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                ${pushDisabledReason || pushing || activeRun != null
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            {pushing ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                            Push {selectedIds.length} to next.co.uk
                        </button>
                    )}

                    {canFulfillRole && (
                        <button
                            type="button"
                            onClick={handleFulfill}
                            disabled={fulfilling}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                ${fulfilling
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'}`}
                        >
                            {fulfilling ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Mark {selectedIds.length} fulfilled
                        </button>
                    )}
                </>
            )}

            {error && (
                <div className="basis-full text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                    {error}
                </div>
            )}

            {activeRun && (
                <div className="basis-full mt-2 bg-white border border-blue-200 rounded p-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-900">
                            Merged push in progress · {activeRun.items.length} items
                        </span>
                        <button
                            type="button"
                            onClick={() => setActiveRun(null)}
                            className="p-1 text-blue-700 hover:bg-blue-50 rounded"
                            title="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <ul className="text-[11px] space-y-1">
                        {activeRun.items.map((it) => (
                            <li key={it.orderItemId} className="flex items-start gap-2">
                                <BatchStatusPill status={it.status} />
                                <span className="text-gray-700 truncate">
                                    Order {String(it.orderId).slice(0, 8)}… · item {String(it.orderItemId).slice(0, 8)}…
                                    {it.message && (
                                        <span className="block text-[10px] text-red-700 italic">
                                            {it.message}
                                        </span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function BatchStatusPill({ status }) {
    const map = {
        QUEUED: { label: 'Queued', cls: 'bg-gray-100 text-gray-700', Icon: Loader2, spin: true },
        ADDED: { label: 'Added', cls: 'bg-green-100 text-green-800', Icon: CheckCircle2 },
        UNAVAILABLE: { label: 'Unavailable', cls: 'bg-amber-100 text-amber-800', Icon: AlertTriangle },
        FAILED: { label: 'Failed', cls: 'bg-red-100 text-red-800', Icon: XCircle }
    };
    const cfg = map[status] || map.QUEUED;
    const Icon = cfg.Icon;
    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.cls}`}>
            <Icon size={10} className={cfg.spin ? 'animate-spin' : ''} />
            {cfg.label}
        </span>
    );
}
