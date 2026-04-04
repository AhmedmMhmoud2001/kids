import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp, TrendingDown, BarChart3, CreditCard,
    Truck, RotateCcw, Package, RefreshCw, Calendar, Filter
} from 'lucide-react';
import { fetchReports } from '../api/dashboard';
import { queryKeys } from '../lib/queryClient';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';

const PRESETS = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
];

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'PENDING', label: 'PENDING' },
    { value: 'CONFIRMED', label: 'CONFIRMED' },
    { value: 'PAID', label: 'PAID' },
    { value: 'PROCESSING', label: 'PROCESSING' },
    { value: 'SHIPPED', label: 'SHIPPED' },
    { value: 'DELIVERED', label: 'DELIVERED' },
    { value: 'RETURNED', label: 'RETURNED' },
    { value: 'REFUNDED', label: 'REFUNDED' },
    { value: 'COMPLETED', label: 'COMPLETED' },
    { value: 'CANCELED', label: 'CANCELED' }
];

// Extensible: add { id: 'WALLET', label: 'Wallet' } when backend supports it
const PAYMENT_METHOD_CONFIG = [
    { id: 'COD', label: 'Cash on Delivery' },
    { id: 'CARD', label: 'Visa / Card' }
];

const formatDate = (d) => {
    if (!d) return '—';
    const x = new Date(d);
    return x.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Reports = () => {
    const { t } = useLanguage();
    const [preset, setPreset] = useState('month');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [status, setStatus] = useState('');

    const queryParams = useMemo(() => {
        const p = { preset, status: status || undefined };
        if (preset === 'custom' && from && to) {
            p.from = from;
            p.to = to;
        }
        return p;
    }, [preset, from, to, status]);

    const { data, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: queryKeys.dashboard.reports(queryParams),
        queryFn: () => fetchReports(queryParams),
        select: (res) => (res.success ? res : null),
        enabled: preset !== 'custom' || (!!from && !!to)
    });

    if (isLoading && !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading reports..." />
            </div>
        );
    }

    return (
        <div className="-m-4 md:-m-6 overflow-x-hidden bg-gray-50/50">
            {/* Header */}
            <div className="pt-6 md:pt-10 pb-6 px-4 md:px-6 bg-slate-900 border-b border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white leading-tight">{t(tx('Reports', 'التقارير'))}</h1>
                            <p className="text-slate-400 mt-1 text-sm md:text-lg font-medium">{t(tx('Sales, orders, payment methods, returns & products', 'المبيعات والطلبات وطرق الدفع والمرتجعات والمنتجات'))}</p>
                        </div>
                        <button
                            onClick={() => refetch()}
                            disabled={isRefetching}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
                            {isRefetching ? t(tx('Refreshing...', 'جاري التحديث...')) : t(tx('Refresh', 'تحديث'))}
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 flex flex-wrap items-end gap-4 p-4 bg-slate-800/50 rounded-xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <Calendar className="text-slate-400 w-5 h-5" />
                            <span className="text-slate-400 text-sm font-medium">Date:</span>
                            <select
                                value={preset}
                                onChange={(e) => setPreset(e.target.value)}
                                className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {PRESETS.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                            {preset === 'custom' && (
                                <>
                                    <input
                                        type="date"
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm"
                                    />
                                    <span className="text-slate-500">→</span>
                                    <input
                                        type="date"
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm"
                                    />
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="text-slate-400 w-5 h-5" />
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {preset === 'custom' && (!from || !to) && (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <p className="text-gray-500 text-center py-8">Select <strong>From</strong> and <strong>To</strong> dates for custom range, then the report will load.</p>
                </div>
            )}

            {isError && !data && preset !== 'custom' && (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <ErrorState title="Failed to load reports" onRetry={refetch} />
                </div>
            )}

            {data && (
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
                    {data.dateRange?.generatedAt && (
                        <p className="text-xs text-gray-500 mb-2">
                            Snapshot-based report (Africa/Cairo). Generated at {new Date(data.dateRange.generatedAt).toLocaleString('en-GB', { timeZone: 'Africa/Cairo' })}. Suitable for Excel/CSV export.
                        </p>
                    )}
                    {/* 1. Sales by Period */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                            <BarChart3 className="w-5 h-5 text-emerald-600" />
                            1. Sales by Period
                        </h2>
                        {data.salesByPeriod && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <p className="text-xs font-bold text-emerald-600 uppercase">Current period</p>
                                    <p className="text-2xl font-black text-gray-800 mt-1">
                                        {Number(data.salesByPeriod.currentPeriod?.revenue ?? 0).toFixed(2)} EGP
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(data.salesByPeriod.currentPeriod?.from)} – {formatDate(data.salesByPeriod.currentPeriod?.to)}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Previous period</p>
                                    <p className="text-xl font-bold text-gray-700 mt-1">
                                        {Number(data.salesByPeriod.previousPeriod?.revenue ?? 0).toFixed(2)} EGP
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(data.salesByPeriod.previousPeriod?.from)} – {formatDate(data.salesByPeriod.previousPeriod?.to)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg border flex flex-col items-center justify-center">
                                    {data.salesByPeriod.changePercent != null ? (
                                        <div className={`flex items-center gap-2 ${data.salesByPeriod.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {data.salesByPeriod.changePercent >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                                            <span className="text-xl font-black">
                                                {data.salesByPeriod.changePercent >= 0 ? '↑' : '↓'} {Math.abs(data.salesByPeriod.changePercent).toFixed(1)}%
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">—</span>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">vs previous period</p>
                                </div>
                            </div>
                        )}
                        {data.salesByPeriod?.changePercent != null && (
                            <p className="mt-3 text-sm text-gray-600">
                                Sales this period {data.salesByPeriod.changePercent >= 0 ? '↑' : '↓'} {Math.abs(data.salesByPeriod.changePercent || 0).toFixed(1)}% vs previous period.
                            </p>
                        )}
                    </section>

                    {/* 2. Orders Status Report */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                            <Truck className="w-5 h-5 text-indigo-600" />
                            2. Orders Status Report
                        </h2>
                        {data.ordersStatusReport && (
                            <>
                                <p className="text-sm text-gray-500 mb-4">Total orders in period: <strong>{data.ordersStatusReport.total}</strong></p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-2 font-bold text-gray-600">Status</th>
                                                <th className="text-right py-2 font-bold text-gray-600">Count</th>
                                                <th className="text-right py-2 font-bold text-gray-600">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(data.ordersStatusReport.byStatus || []).map((row) => (
                                                <tr key={row.status} className="border-b border-gray-100">
                                                    <td className="py-2 font-medium text-gray-800">{row.status}</td>
                                                    <td className="py-2 text-right text-gray-700">{row.count}</td>
                                                    <td className="py-2 text-right font-medium text-gray-700">{row.percent.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </section>

                    {/* 3. Payment Methods */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                            <CreditCard className="w-5 h-5 text-amber-600" />
                            3. Payment Methods Report
                        </h2>
                        {data.paymentMethodsReport && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {PAYMENT_METHOD_CONFIG.map(({ id, label }) => {
                                    const r = data.paymentMethodsReport[id] || { orderCount: 0, totalAmount: 0 };
                                    return (
                                        <div key={id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="font-bold text-gray-700">{label}</p>
                                            <p className="text-2xl font-black text-gray-800 mt-1">{r.orderCount} orders</p>
                                            <p className="text-lg font-bold text-emerald-700 mt-1">{Number(r.totalAmount).toFixed(2)} EGP</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* 4. Returns Report */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                            <RotateCcw className="w-5 h-5 text-orange-600" />
                            4. Returns Report
                        </h2>
                        {data.returnsReport && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                        <p className="text-xs font-bold text-orange-600 uppercase">Returned orders</p>
                                        <p className="text-2xl font-black text-gray-800">{data.returnsReport.count}</p>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                        <p className="text-xs font-bold text-orange-600 uppercase">Total refunded amount</p>
                                        <p className="text-2xl font-black text-gray-800">{Number(data.returnsReport.totalAmount || 0).toFixed(2)} EGP</p>
                                    </div>
                                </div>
                                {data.returnsReport.reasons?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-bold text-gray-600 mb-2">Return reasons (with count and amount)</p>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="text-left py-2 font-bold text-gray-600">Reason</th>
                                                        <th className="text-right py-2 font-bold text-gray-600">Count</th>
                                                        <th className="text-right py-2 font-bold text-gray-600">Amount (EGP)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.returnsReport.reasons.map((r, i) => (
                                                        <tr key={i} className="border-b border-gray-100">
                                                            <td className="py-2 text-gray-800">{r.reason}</td>
                                                            <td className="py-2 text-right text-gray-700">{r.count}</td>
                                                            <td className="py-2 text-right font-medium text-gray-700">{typeof r.amount === 'number' ? r.amount.toFixed(2) : '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </section>

                    {/* 5. Products Report (light) */}
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                            <Package className="w-5 h-5 text-pink-600" />
                            5. Products Report
                        </h2>
                        {data.productsReport && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm font-bold text-gray-600 mb-2">Not sold in period (sample)</p>
                                    <ul className="text-sm text-gray-700 space-y-1 max-h-48 overflow-y-auto">
                                        {(data.productsReport.notSoldInPeriod || []).length === 0 ? (
                                            <li className="text-gray-500">None</li>
                                        ) : (
                                            (data.productsReport.notSoldInPeriod || []).map((p) => (
                                                <li key={p.id}>{p.name}</li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-600 mb-2">Most cancelled (in period)</p>
                                    <ul className="text-sm text-gray-700 space-y-1 max-h-48 overflow-y-auto">
                                        {(data.productsReport.mostCancelled || []).length === 0 ? (
                                            <li className="text-gray-500">None</li>
                                        ) : (
                                            (data.productsReport.mostCancelled || []).map((p) => (
                                                <li key={p.productId}>{p.name} — cancelled {p.cancelledCount}×</li>
                                            ))
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
};

export default Reports;
