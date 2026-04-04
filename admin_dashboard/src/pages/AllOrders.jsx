import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Search, X, Package, Truck, CheckCircle, Clock, Filter, Edit2, Save, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { fetchOrders, updateOrderStatus, updateOrderDetails, updateOrderItems, deleteOrder } from '../api/orders';
import { fetchProducts } from '../api/products';
import { getSafeImageUrl, getProductDisplayImage } from '../utils/imageUtils';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { tx } from '../i18n/text';

const AllOrders = () => {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [audienceFilter, setAudienceFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        phone: '',
        notes: '',
        shippingAddress: {}
    });
    const [editItems, setEditItems] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [itemSearch, setItemSearch] = useState('');
    const [highlightedOrderId, setHighlightedOrderId] = useState(null);

    const loadProducts = useCallback(async () => {
        try {
            const res = await fetchProducts(audienceFilter === 'ALL' ? null : audienceFilter, { limit: 200 });
            if (res.success) setAllProducts(res.data);
        } catch (err) { console.error(err); }
    }, [audienceFilter]);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            // If audienceFilter is ALL, we don't pass audience to fetchOrders (it uses SYSTEM_ADMIN power to see everything)
            const response = await fetchOrders(audienceFilter === 'ALL' ? null : audienceFilter);
            if (response.success) {
                setOrders(response.data);
            } else {
                setError(t(tx('Failed to load orders', 'فشل تحميل الطلبات')));
            }
        } catch (err) {
            setError(err.message || t(tx('An error occurred', 'حدث خطأ')));
        } finally {
            setLoading(false);
        }
    }, [audienceFilter]);

    useEffect(() => {
        loadOrders();
        loadProducts();
    }, [loadOrders, loadProducts]);

    // Handle orderId from URL query params (from notifications)
    useEffect(() => {
        const orderIdParam = searchParams.get('orderId');
        if (orderIdParam && orders.length > 0) {
            const orderId = parseInt(orderIdParam);
            const order = orders.find(o => o.id === orderId);
            if (order) {
                setSelectedOrder(order);
                setHighlightedOrderId(orderId);
                // Clear the query param after opening
                setSearchParams({});
            }
        }
    }, [searchParams, orders, setSearchParams]);

    const handleUpdateOrderDetails = async () => {
        try {
            await updateOrderDetails(selectedOrder.id, editForm);
            await updateOrderItems(selectedOrder.id, editItems);
            setIsEditing(false);
            loadOrders();
            setSelectedOrder(null);
        } catch (err) {
            alert(`${t(tx('Error updating order', 'خطأ أثناء تحديث الطلب'))}: ${err.message}`);
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            let cancelReason = null;
            let returnReason = null;
            if (newStatus === 'CANCELED') {
                cancelReason = prompt(t(tx('Please enter the reason for cancellation (this will be sent to the user):', 'يرجى إدخال سبب الإلغاء (سيتم إرساله للمستخدم):')));
                if (cancelReason === null) return;
            }
            if (newStatus === 'RETURNED' || newStatus === 'REFUNDED') {
                returnReason = prompt(newStatus === 'REFUNDED'
                    ? t(tx('Refund notes (e.g. completed, method):', 'ملاحظات الاسترداد (مثال: تم/الطريقة):'))
                    : t(tx('Return notes (e.g. sellable / damaged, refund method):', 'ملاحظات الإرجاع (مثال: صالح/تالف، طريقة الاسترداد):')));
                if (returnReason === null) return;
            }

            const response = await updateOrderStatus(orderId, newStatus, cancelReason, returnReason);
            if (response.success) {
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status: newStatus, cancelReason: cancelReason ?? selectedOrder.cancelReason, returnReason: returnReason ?? selectedOrder.returnReason });
                }
                loadOrders();
            }
        } catch (err) {
            alert(`${t(tx('Error updating status', 'خطأ أثناء تحديث الحالة'))}: ${err.message}`);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm(t(tx('Are you sure you want to delete this order completely? This action cannot be undone.', 'هل أنت متأكد من حذف هذا الطلب نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.')))) {
            return;
        }

        try {
            const response = await deleteOrder(orderId);
            if (response.success) {
                setOrders(orders.filter(o => o.id !== orderId));
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder(null);
                }
            }
        } catch (err) {
            alert(`${t(tx('Error deleting order', 'خطأ أثناء حذف الطلب'))}: ${err.message}`);
        }
    };

    const startEditing = (order = null) => {
        const orderToEdit = order || selectedOrder;
        if (!orderToEdit) return;

        setEditForm({
            phone: orderToEdit.phone || orderToEdit.billingInfo?.phone || '',
            notes: orderToEdit.notes || '',
            shippingAddress: orderToEdit.shippingAddress || {}
        });
        setEditItems(orderToEdit.items.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName || item.product?.name,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
            product: item.product
        })));
        setIsEditing(true);
    };

    const updateItemQty = (id, delta) => {
        setEditItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (id) => {
        setEditItems(prev => prev.filter(item => item.id !== id));
    };

    const addProductToOrder = (product) => {
        const existing = editItems.find(i => i.productId === product.id);
        if (existing) {
            updateItemQty(existing.id, 1);
        } else {
            setEditItems(prev => [...prev, {
                id: `new-${Date.now()}`,
                productId: product.id,
                productName: product.name,
                quantity: 1,
                priceAtPurchase: product.basePrice ?? product.price ?? (product.variants?.[0]?.price ?? 0),
                product: product
            }]);
        }
        setItemSearch('');
    };

    const searchResults = itemSearch
        ? allProducts.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 5)
        : [];

    const getPaymentMethodLabel = (method) => {
        if (method === 'CARD') return 'Credit/Debit Card';
        if (method === 'COD') return 'Cash on Delivery';
        return method || '—';
    };
    const getPaymentMethodDescription = (method) => {
        if (method === 'CARD') return 'Pay securely with your card';
        if (method === 'COD') return 'Pay when you receive your order';
        return '';
    };

    // Flow: PENDING → CONFIRMED/PAID (no stock) → PROCESSING (stock deduct) → SHIPPED → DELIVERED | RETURNED → REFUNDED | COMPLETED | CANCELED
    const getStatusOptionsForPaymentMethod = (paymentMethod) => {
        const rest = [
            { value: 'PROCESSING', label: 'PROCESSING' },
            { value: 'SHIPPED', label: 'SHIPPED' },
            { value: 'DELIVERED', label: 'DELIVERED' },
            { value: 'RETURNED', label: 'RETURNED' },
            { value: 'REFUNDED', label: 'REFUNDED' },
            { value: 'COMPLETED', label: 'COMPLETED' },
            { value: 'CANCELED', label: 'CANCELED' }
        ];
        if (paymentMethod === 'CARD') {
            return [{ value: 'PENDING', label: 'PENDING' }, { value: 'PAID', label: 'PAID' }, ...rest];
        }
        return [{ value: 'PENDING', label: 'PENDING' }, { value: 'CONFIRMED', label: 'CONFIRMED' }, ...rest];
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800';
            case 'PROCESSING': return 'bg-indigo-100 text-indigo-800';
            case 'SHIPPED': return 'bg-purple-100 text-purple-800';
            case 'DELIVERED': return 'bg-blue-100 text-blue-800';
            case 'RETURNED': return 'bg-orange-100 text-orange-800';
            case 'REFUNDED': return 'bg-amber-100 text-amber-800';
            case 'COMPLETED': return 'bg-teal-100 text-teal-800';
            case 'CANCELED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const canEditOrder = (order) => ['PENDING', 'CONFIRMED', 'PAID'].includes(order?.status);
    const canCancelOrder = (order) => ['PENDING', 'CONFIRMED', 'PAID'].includes(order?.status);

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id.toString().includes(searchTerm) ||
            (order.user && (
                order.user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        const matchesStatus = statusFilter === '' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatAddress = (address) => {
        if (!address) return 'N/A';
        try {
            const addr = typeof address === 'string' ? JSON.parse(address) : address;
            return `${addr.address || ''}, ${addr.city || ''}, ${addr.country || ''}`.replace(/^, /, '');
        } catch {
            return String(address);
        }
    };

    const safeParse = (data, fallback = []) => {
        if (!data) return fallback;
        if (typeof data !== 'string') return data;
        try {
            return JSON.parse(data);
        } catch {
            if (data.startsWith('http')) return [data];
            return fallback;
        }
    };

    if (loading) return <div className="p-8 text-center">{t(tx('Loading all orders...', 'جاري تحميل كل الطلبات...'))}</div>;
    if (error) return <div className="p-8 text-center text-red-600">{t(tx('Error', 'خطأ'))}: {error}</div>;

    return (
        <div className="space-y-6 overflow-x-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{t(tx('Total Orders Management', 'إدارة جميع الطلبات'))}</h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1">{t(tx('Full control over all Kids & Next system orders', 'تحكم كامل في طلبات كيدز ونكست'))}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                    <Filter size={18} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{t(tx('Scope:', 'النطاق:'))}</span>
                    <select
                        value={audienceFilter}
                        onChange={(e) => setAudienceFilter(e.target.value)}
                        className="text-sm border-none focus:ring-0 cursor-pointer font-bold text-blue-600 outline-none"
                    >
                        <option value="ALL">{t(tx('All Orders (Combined)', 'كل الطلبات (مجتمعة)'))}</option>
                        <option value="KIDS">{t(tx('Kids Audience', 'فئة كيدز'))}</option>
                        <option value="NEXT">{t(tx('Next Audience', 'فئة نكست'))}</option>
                    </select>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t(tx('Search all orders by customer name, or email...', 'ابحث في الطلبات باسم العميل أو البريد الإلكتروني...'))}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{t(tx('Status:', 'الحالة:'))}</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        >
                            <option value="">{t(tx('All Status', 'كل الحالات'))}</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PAID">Paid</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="RETURNED">Returned</option>
                            <option value="REFUNDED">Refunded</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELED">Canceled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto modern-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                            <tr>

                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Payment</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Discount</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total Price</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    className={`hover:${isDark ? 'bg-slate-800' : 'bg-gray-50'} transition-colors ${highlightedOrderId === order.id ? (isDark ? 'bg-blue-900/30 ring-2 ring-blue-400' : 'bg-blue-50 ring-2 ring-blue-300 ring-inset') : ''}`}
                                >

                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {t(order.user?.firstName)} {t(order.user?.lastName)}
                                        </div>
                                        <div className="text-xs text-gray-500">{order.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-gray-700">{getPaymentMethodLabel(order.paymentMethod)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-red-600">
                                        {parseFloat(order.discount || 0) > 0 ? `-${parseFloat(order.discount).toFixed(2)} EGP` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-blue-600">
                                        {parseFloat(order.totalAmount).toFixed(2)} EGP
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-full border-none cursor-pointer outline-none ${getStatusColor(order.status)}`}
                                        >
                                            {getStatusOptionsForPaymentMethod(order.paymentMethod).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                            {!getStatusOptionsForPaymentMethod(order.paymentMethod).some(o => o.value === order.status) && (
                                                <option value={order.status}>{order.status}</option>
                                            )}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Eye size={16} />

                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    startEditing(order);
                                                }}
                                                className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800 font-medium bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />

                                            </button>
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />

                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Analysis Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 bg-white">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Analysis & Edit Order</h2>
                                <p className="text-sm text-gray-500">System Management Console</p>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                {selectedOrder.status === 'PENDING' && (
                                    <>
                                        {(selectedOrder.paymentMethod === 'COD' || !selectedOrder.paymentMethod) && (
                                            <button
                                                onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CONFIRMED')}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg shadow-green-200 transition-colors"
                                                title="Confirm order (COD) — no stock deducted yet"
                                            >
                                                <CheckCircle size={18} />
                                                Confirm (COD)
                                            </button>
                                        )}
                                        {selectedOrder.paymentMethod === 'CARD' && (
                                            <button
                                                onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PAID')}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200 transition-colors"
                                                title="Mark as paid (card) — no stock deducted yet"
                                            >
                                                <CreditCard size={18} />
                                                Mark as paid
                                            </button>
                                        )}
                                    </>
                                )}
                                {(selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'PAID') && (
                                    <button
                                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PROCESSING')}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-colors"
                                        title="Start processing — stock will be deducted"
                                    >
                                        <Package size={18} />
                                        Start Processing (خصم المخزون)
                                    </button>
                                )}
                                {canCancelOrder(selectedOrder) && (
                                    <button
                                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CANCELED')}
                                        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <X size={16} /> Cancel order
                                    </button>
                                )}
                                {isEditing && (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button onClick={handleUpdateOrderDetails} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200">
                                            <Save size={18} /> SAVE CHANGES
                                        </button>
                                    </div>
                                )}
                                {canEditOrder(selectedOrder) && !isEditing && (
                                    <button
                                        onClick={() => startEditing()}
                                        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} /> Edit
                                    </button>
                                )}
                                {canEditOrder(selectedOrder) && (
                                    <button
                                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                                        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                )}
                                <button onClick={() => { setSelectedOrder(null); setIsEditing(false); }} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase">Customer Intelligence</h3>
                                        {canEditOrder(selectedOrder) && !isEditing && (
                                            <button
                                                onClick={() => startEditing()}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-bold text-xs"
                                            >
                                                <Edit2 size={14} /> EDIT
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Identity</p>
                                            <p className="font-semibold text-gray-900">{t(selectedOrder.user?.firstName)} {t(selectedOrder.user?.lastName)}</p>
                                            <p className="text-sm text-blue-500">{selectedOrder.user?.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Phone</p>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.phone}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-700">{selectedOrder.phone || selectedOrder.billingInfo?.phone || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Shipping Address</p>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.shippingAddress?.address || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, shippingAddress: { ...editForm.shippingAddress, address: e.target.value } })}
                                                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-700">{formatAddress(selectedOrder.shippingAddress)}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">System Notes</p>
                                            {isEditing ? (
                                                <textarea
                                                    value={editForm.notes}
                                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none h-20"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-600 italic">{selectedOrder.notes || 'No system notes provided'}</p>
                                            )}
                                        </div>
                                        {selectedOrder.status === 'CANCELED' && selectedOrder.cancelReason && (
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                                <p className="text-[10px] text-red-500 uppercase font-bold">Cancellation Reason (Sent to User)</p>
                                                <p className="text-sm text-red-700 leading-relaxed font-medium">{selectedOrder.cancelReason}</p>
                                            </div>
                                        )}
                                        {selectedOrder.status === 'RETURNED' && selectedOrder.returnReason && (
                                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 min-w-0 overflow-hidden">
                                                <p className="text-[10px] text-orange-600 uppercase font-bold">Return Notes</p>
                                                <p className="text-sm text-orange-800 leading-relaxed font-medium wrap-break-word whitespace-pre-wrap min-w-0">{selectedOrder.returnReason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4">Financial Overview</h3>
                                    <div className="space-y-4">
                                        <div className="pb-3 border-b border-gray-100">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Payment Method</p>
                                            <p className="text-sm font-semibold text-gray-900">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</p>
                                            {getPaymentMethodDescription(selectedOrder.paymentMethod) && (
                                                <p className="text-xs text-gray-500 mt-0.5">{getPaymentMethodDescription(selectedOrder.paymentMethod)}</p>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                                            <span className="text-sm font-semibold text-blue-700">Total Profitability</span>
                                            <span className="text-lg font-black text-blue-600">
                                                {parseFloat(
                                                    isEditing
                                                        ? (editItems.reduce((s, i) => s + (i.quantity * i.priceAtPurchase), 0) + Number(selectedOrder.shippingFee) - Number(selectedOrder.discount))
                                                        : selectedOrder.totalAmount
                                                ).toFixed(2)} EGP
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">Subtotal</p>
                                                <p className="text-sm font-medium">{parseFloat(selectedOrder.subtotal).toFixed(2)} EGP</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">Shipping</p>
                                                <p className="text-sm font-medium">{parseFloat(selectedOrder.shippingFee).toFixed(2)} EGP</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-red-500 uppercase font-bold">Discount</p>
                                                <p className="text-sm font-medium text-red-600">-{parseFloat(selectedOrder.discount).toFixed(2)} EGP</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <h3 className="p-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase">Product Composition</h3>
                                {isEditing && (
                                    <div className="p-4 bg-blue-50/50 border-b border-gray-100">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search product to add..."
                                                value={itemSearch}
                                                onChange={(e) => setItemSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none bg-white font-medium"
                                            />
                                            {searchResults.length > 0 && (
                                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-lg shadow-xl z-50 divide-y overflow-hidden animate-fade-in border-blue-100">
                                                    {searchResults.map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => addProductToOrder(p)}
                                                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                                                                    {getProductDisplayImage(p) && <img src={getSafeImageUrl(getProductDisplayImage(p))} alt="" className="w-full h-full object-cover" />}
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600">{p.name}</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded">{parseFloat(p.price).toFixed(2)} EGP</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="divide-y divide-gray-100">
                                    {(isEditing ? editItems : selectedOrder.items).map((item) => (
                                        <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                                            <div className="w-14 h-14 bg-gray-100 rounded shrink-0 overflow-hidden">
                                                {getProductDisplayImage(item.product) && (
                                                    <img
                                                        src={getSafeImageUrl(getProductDisplayImage(item.product))}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-gray-900">{item.productName || item.product?.name}</p>
                                                <p className="text-xs text-gray-500 font-medium">{parseFloat(item.priceAtPurchase).toFixed(2)} EGP</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center border rounded-lg px-2 py-1 gap-3 bg-white shadow-sm">
                                                            <button onClick={() => updateItemQty(item.id, -1)} className="p-1 hover:text-blue-600">
                                                                <Minus size={14} />
                                                            </button>
                                                            <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                                                            <button onClick={() => updateItemQty(item.id, 1)} className="p-1 hover:text-blue-600">
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                        <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">Qty: {item.quantity}</p>
                                                )}
                                                <div className="text-right min-w-[80px]">
                                                    <p className="text-sm font-black text-gray-900">{(item.quantity * item.priceAtPurchase).toFixed(2)} EGP</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllOrders;
