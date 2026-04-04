import React, { useState, useEffect } from 'react';
import { Save, Truck, Info, CheckCircle2, Package } from 'lucide-react';
import { fetchSettings, updateSetting, getCurrencySettings, updateCurrencySettings } from '../api/settings';

const Settings = () => {
    const [shippingFee, setShippingFee] = useState('');
    const [showOutOfStock, setShowOutOfStock] = useState(true);
    const [currencyCode, setCurrencyCode] = useState('EGP');
    const [currencySymbol, setCurrencySymbol] = useState('EGP');
    const [currencyLocale, setCurrencyLocale] = useState('en-EG');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const [response, currency] = await Promise.all([fetchSettings(), getCurrencySettings()]);
            if (response.success) {
                const shipping = response.data.find(s => s.key === 'shipping_fee');
                if (shipping) setShippingFee(shipping.value);
                const outOfStock = response.data.find(s => s.key === 'show_out_of_stock');
                if (outOfStock !== undefined) setShowOutOfStock(String(outOfStock?.value).toLowerCase() === 'true');
                else setShowOutOfStock(true);
            }
            if (currency) {
                setCurrencyCode(currency.code || 'EGP');
                setCurrencySymbol(currency.symbol || 'EGP');
                setCurrencyLocale(currency.locale || 'en-EG');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage(null);
            const [resShipping, resOut, resCurrency] = await Promise.all([
                updateSetting('shipping_fee', shippingFee),
                updateSetting('show_out_of_stock', showOutOfStock ? 'true' : 'false'),
                updateCurrencySettings({
                    code: currencyCode,
                    symbol: currencySymbol,
                    locale: currencyLocale
                })
            ]);
            if (resShipping.success && resOut.success && resCurrency.success) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({
                    type: 'error',
                    text: resShipping.message || resOut.message || resCurrency.message || 'Failed to update'
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Configuration...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Configuration</h1>
                    <p className="text-gray-500 mt-1 text-base">Global settings control for the entire platform</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                <div className="bg-linear-to-r from-blue-600 to-indigo-700 px-8 py-6">
                    <div className="flex items-center gap-3 text-white">
                        <Truck size={28} className="animate-bounce" />
                        <h2 className="text-xl font-bold">Delivery & Logistics</h2>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSave} className="space-y-8">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                                Global Shipping Fee ({currencySymbol || currencyCode})
                                <Info size={14} className="text-blue-500 cursor-help" />
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-gray-400 font-bold">{currencySymbol || currencyCode}</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={shippingFee}
                                    onChange={(e) => setShippingFee(e.target.value)}
                                    placeholder="Enter amount (e.g. 150.00)"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg font-semibold text-gray-800 group-hover:bg-white"
                                    required
                                />
                            </div>
                            <p className="mt-3 text-sm text-gray-400 italic flex items-center gap-1">
                                <Info size={14} />
                                This fee will be automatically applied to all new orders during checkout.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                    Currency Code
                                </label>
                                <input
                                    type="text"
                                    maxLength={3}
                                    value={currencyCode}
                                    onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                                    placeholder="EGP"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                    Currency Symbol
                                </label>
                                <input
                                    type="text"
                                    value={currencySymbol}
                                    onChange={(e) => setCurrencySymbol(e.target.value)}
                                    placeholder="EGP"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                    Currency Locale
                                </label>
                                <input
                                    type="text"
                                    value={currencyLocale}
                                    onChange={(e) => setCurrencyLocale(e.target.value)}
                                    placeholder="en-EG"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {message.type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />}
                                <span className="font-semibold">{message.text}</span>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Save size={20} />
                                )}
                                {saving ? 'Propagating Changes...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Product display: show out of stock */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl mt-8">
                <div className="bg-linear-to-r from-amber-500 to-orange-600 px-8 py-6">
                    <div className="flex items-center gap-3 text-white">
                        <Package size={28} />
                        <h2 className="text-xl font-bold">Product display</h2>
                    </div>
                </div>
                <div className="p-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Show out-of-stock variants</label>
                            <p className="text-sm text-gray-500">When off, product detail page hides color/size options that are out of stock.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showOutOfStock}
                                onChange={(e) => setShowOutOfStock(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                            <span className="ms-3 text-sm font-medium text-gray-700">{showOutOfStock ? 'On' : 'Off'}</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Quick Preview Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Current Rate</p>
                    <p className="text-2xl font-black text-blue-600 font-primary">{shippingFee || '0.00'} {currencySymbol || currencyCode}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Scope</p>
                    <p className="text-sm font-semibold text-gray-700">All Audiences (Kids & Next)</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold text-gray-700">Live on Production</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
