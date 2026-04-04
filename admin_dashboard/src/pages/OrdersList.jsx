import React, { useState, useEffect } from 'react';
import { Eye, Search, X, Package, Truck, CheckCircle, Clock, Edit2, Save, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { fetchOrders, updateOrderStatus, updateOrderDetails, updateOrderItems, deleteOrder } from '../api/orders';
import { fetchProducts } from '../api/products';
import { getSafeImageUrl, getProductDisplayImage } from '../utils/imageUtils';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { tx } from '../i18n/text';

const OrdersList = ({ audience, title }) => {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        phone: '',
        notes: '',
        shippingAddress: {}
    });
    const [editItems, setEditItems] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [itemSearch, setItemSearch] = useState('');

    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadOrders();
        loadProducts();
    }, [audience]);

    const loadProducts = async () => {
        try {
            const res = await fetchProducts(audience, { limit: 200 });
            if (res.success) setAllProducts(res.data);
        } catch (err) { console.error(err); }
    };

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchOrders(audience);
            if (response.success) {
                setOrders(response.data);
            } else {
                setError('Failed to load orders');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOrderDetails = async () => {
        try {
            // 1. Update Details
            await updateOrderDetails(selectedOrder.id, editForm);

            // 2. Update Items if changed
            await updateOrderItems(selectedOrder.id, editItems);

            setIsEditing(false);
            loadOrders();
            // Close modal after serious changes to refresh state correctly
            setSelectedOrder(null);
        } catch (err) {
            alert('Error updating order: ' + err.message);
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            let cancelReason = null;
            let returnReason = null;
            if (newStatus === 'CANCELED') {
                cancelReason = prompt('Please enter the reason for cancellation (this will be sent to the user):');
                if (cancelReason === null) return; // User cancelled the prompt
            }
            if (newStatus === 'RETURNED') {
                returnReason = prompt('Return notes (e.g. sellable / damaged, refund method):');
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
            alert('Error updating status: ' + err.message);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to delete this order completely? This action cannot be undone.')) {
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
            alert('Error deleting order: ' + err.message);
        }
    };

    const startEditing = (order = null) => {
        const orderToEdit = order || selectedOrder;
        if (!orderToEdit) return;

        setEditForm({
            phone: orderToEdit.phone || '',
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
    const getStatusOptionsForPaymentMethod = (paymentMethod) => {
        if (paymentMethod === 'CARD') {
            return [
                { value: 'PENDING', label: 'PENDING' },
                { value: 'PAID', label: 'PAID' },
                { value: 'SHIPPED', label: 'SHIPPED' },
                { value: 'DELIVERED', label: 'DELIVERED' },
                { value: 'CANCELED', label: 'CANCELED' },
                { value: 'RETURNED', label: 'RETURNED' }
            ];
        }
        return [
            { value: 'PENDING', label: 'PENDING' },
            { value: 'CONFIRMED', label: 'CONFIRMED' },
            { value: 'SHIPPED', label: 'SHIPPED' },
            { value: 'DELIVERED', label: 'DELIVERED' },
            { value: 'CANCELED', label: 'CANCELED' },
            { value: 'RETURNED', label: 'RETURNED' }
        ];
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800';
            case 'SHIPPED': return 'bg-purple-100 text-purple-800';
            case 'DELIVERED': return 'bg-blue-100 text-blue-800';
            case 'CANCELED': return 'bg-red-100 text-red-800';
            case 'RETURNED': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

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
        if (typeof address === 'string') return address;
        try {
            const addr = typeof address === 'string' ? JSON.parse(address) : address;
            return `${addr.address || ''}, ${addr.city || ''}, ${addr.country || ''}`.replace(/^, /, '');
        } catch (e) {
            return String(address);
        }
    };

    const safeParse = (data, fallback = []) => {
        if (!data) return fallback;
        if (typeof data !== 'string') return data;
        try {
            return JSON.parse(data);
        } catch (e) {
            if (data.startsWith('http')) return [data];
            return fallback;
        }
    };

    if (loading) return <div className="p-8 text-center">Loading orders...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

    return (
        <div className="space-y-6 overflow-x-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{t(title)}</h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Manage orders for {audience} audience</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t(tx('Search orders by ID, name, or email...', 'ابحث عن الطلبات بالرقم أو الاسم أو البريد...'))}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{t(tx('Status', 'الحالة'))}:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        >
                            <option value="">{t(tx('All Status', 'كل الحالات'))}</option>
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELED">Canceled</option>
                            <option value="RETURNED">Returned</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="overflow-x-auto modern-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                            <tr>

                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Payment</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Discount</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className={`hover:${isDark ? 'bg-slate-800' : 'bg-gray-50'} transition-colors`}>

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
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Eye size={16} />
                                                Details
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    startEditing(order);
                                                }}
                                                className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800 font-medium bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredOrders.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No orders found
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" style={{ zIndex: 99999 }}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slide-in-bottom">
                        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Order Details</h2>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <p className="text-xs md:text-sm text-gray-500 mt-1">
                                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {selectedOrder.status === 'PENDING' && (
                                    <>
                                        {(selectedOrder.paymentMethod === 'COD' || !selectedOrder.paymentMethod) && (
                                            <button
                                                onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CONFIRMED')}
                                                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-white font-medium bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                                title="تأكيد الطلب (COD) — ينقص المخزون"
                                            >
                                                <CheckCircle size={16} />
                                                <span className="hidden sm:inline">Confirm order (تأكيد الطلب)</span>
                                            </button>
                                        )}
                                        {selectedOrder.paymentMethod === 'CARD' && (
                                            <button
                                                onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PAID')}
                                                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-white font-medium bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                                                title="تسجيل الدفع — ينقص المخزون"
                                            >
                                                <CreditCard size={16} />
                                                <span className="hidden sm:inline">Mark as paid (مدفوع)</span>
                                            </button>
                                        )}
                                    </>
                                )}
                                <button
                                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                    <span className="hidden sm:inline">Delete Order</span>
                                </button>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6 md:space-y-8 bg-gray-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm relative group/card">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer Info</h3>
                                        {!isEditing && (
                                            <button
                                                onClick={() => startEditing()}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-bold text-xs"
                                            >
                                                <Edit2 size={14} />
                                                EDIT ORDER
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Name</p>
                                            <p className="font-medium text-gray-900 text-sm md:text-base">{t(selectedOrder.user?.firstName)} {t(selectedOrder.user?.lastName)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Email</p>
                                            <p className="font-medium text-gray-900 text-sm md:text-base break-all">{selectedOrder.user?.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Phone</p>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.phone}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    className="w-full mt-1 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            ) : (
                                                <p className="font-medium text-gray-900 text-sm">{selectedOrder.phone || 'N/A'}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Notes</p>
                                            {isEditing ? (
                                                <textarea
                                                    value={editForm.notes}
                                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                                    className="w-full mt-1 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none h-16"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-600">{selectedOrder.notes || 'No notes'}</p>
                                            )}
                                        </div>
                                        {selectedOrder.status === 'CANCELED' && selectedOrder.cancelReason && (
                                            <div className="bg-red-50 p-2 rounded border border-red-100">
                                                <p className="text-[10px] text-red-500 uppercase font-bold">Cancellation Reason</p>
                                                <p className="text-sm text-red-700">{selectedOrder.cancelReason}</p>
                                            </div>
                                        )}
                                        {selectedOrder.status === 'RETURNED' && selectedOrder.returnReason && (
                                            <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                                <p className="text-[10px] text-orange-600 uppercase font-bold">Return Notes</p>
                                                <p className="text-sm text-orange-800">{selectedOrder.returnReason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Shipping & Payment</h3>
                                        {isEditing && (
                                            <div className="flex gap-2">
                                                <button onClick={() => setIsEditing(false)} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                                                <button onClick={handleUpdateOrderDetails} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                                                    <Save size={12} /> Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Address</p>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.shippingAddress?.address || ''}
                                                    onChange={(e) => setEditForm({
                                                        ...editForm,
                                                        shippingAddress: { ...editForm.shippingAddress, address: e.target.value }
                                                    })}
                                                    className="w-full mt-1 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                                                />
                                            ) : (
                                                <p className="font-medium text-gray-900 text-sm md:text-base">{formatAddress(selectedOrder.shippingAddress)}</p>
                                            )}
                                        </div>
                                        <div className="flex justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase">Payment Method</p>
                                                <p className="font-medium text-gray-900 text-sm">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</p>
                                                {getPaymentMethodDescription(selectedOrder.paymentMethod) && (
                                                    <p className="text-xs text-gray-500 mt-0.5">{getPaymentMethodDescription(selectedOrder.paymentMethod)}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-500 uppercase">Update Status</p>
                                                <select
                                                    value={selectedOrder.status}
                                                    onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                                                    className="mt-1 text-xs border rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-blue-100"
                                                >
                                                    {getStatusOptionsForPaymentMethod(selectedOrder.paymentMethod).map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                    {!getStatusOptionsForPaymentMethod(selectedOrder.paymentMethod).some(o => o.value === selectedOrder.status) && (
                                                        <option value={selectedOrder.status}>{selectedOrder.status}</option>
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <h3 className="p-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase text-center">Order Items</h3>
                                <div className="divide-y divide-gray-100">
                                    {isEditing && (
                                        <div className="p-4 bg-blue-50/50 border-b border-gray-100">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder={t(tx('Search product to add...', 'ابحث عن منتج لإضافته...'))}
                                                    value={itemSearch}
                                                    onChange={(e) => setItemSearch(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                                />
                                                {searchResults.length > 0 && (
                                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-lg shadow-xl z-50 divide-y overflow-hidden animate-fade-in">
                                                        {searchResults.map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => addProductToOrder(p)}
                                                                className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden">
                                                                        {getProductDisplayImage(p) && <img src={getSafeImageUrl(getProductDisplayImage(p))} alt="" className="w-full h-full object-cover" />}
                                                                    </div>
                                                                    <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600">{p.name}</span>
                                                                </div>
                                                                <span className="text-[10px] font-black text-gray-400">{parseFloat(p.price).toFixed(2)} EGP</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {(isEditing ? editItems : selectedOrder.items).map((item) => (
                                        <div key={item.id} className="p-4 flex flex-col sm:flex-row items-center gap-4 md:gap-6 hover:bg-gray-50 transition-colors">
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                {getProductDisplayImage(item.product) && (
                                                    <img
                                                        src={getSafeImageUrl(getProductDisplayImage(item.product))}
                                                        alt={item.product?.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 text-center sm:text-left">
                                                <h4 className="font-bold text-gray-900 text-sm md:text-base">{item.product?.name || item.productName || 'Deleted Product'}</h4>
                                                <p className="text-xs text-gray-500 italic">
                                                    {parseFloat(item.priceAtPurchase).toFixed(2)} EGP
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {isEditing ? (
                                                    <>
                                                        <div className="flex items-center border rounded-lg px-2 py-1 gap-3 bg-gray-50">
                                                            <button onClick={() => updateItemQty(item.id, -1)} className="p-1 hover:text-blue-600 transition-colors">
                                                                <Minus size={14} />
                                                            </button>
                                                            <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                                                            <button onClick={() => updateItemQty(item.id, 1)} className="p-1 hover:text-blue-600 transition-colors">
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                        <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                )}
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <p className="text-base md:text-lg font-bold text-gray-900">
                                                    {(item.quantity * parseFloat(item.priceAtPurchase)).toFixed(2)} EGP
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {isEditing && editItems.length === 0 && (
                                        <div className="p-8 text-center text-gray-400 text-sm italic">
                                            No items in list. Add products or cancel editing.
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 space-y-2">
                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{parseFloat(isEditing ? editItems.reduce((s, i) => s + (i.quantity * i.priceAtPurchase), 0) : selectedOrder.subtotal).toFixed(2)} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span>Shipping Fee</span>
                                        <span>+{parseFloat(selectedOrder.shippingFee).toFixed(2)} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-red-600">
                                        <span>Discount</span>
                                        <span>-{parseFloat(selectedOrder.discount).toFixed(2)} EGP</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                        <span className="text-gray-900 font-bold">Total Amount</span>
                                        <span className="text-xl md:text-2xl font-black text-blue-600">
                                            {parseFloat(
                                                isEditing
                                                    ? (editItems.reduce((s, i) => s + (i.quantity * i.priceAtPurchase), 0) + Number(selectedOrder.shippingFee) - Number(selectedOrder.discount))
                                                    : selectedOrder.totalAmount
                                            ).toFixed(2)} EGP
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersList;
