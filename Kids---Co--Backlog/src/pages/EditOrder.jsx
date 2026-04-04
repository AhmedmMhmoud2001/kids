import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchOrderById, updateOrderDetails, updateOrderItems, cancelOrder } from "../api/orders";
import { getProductImageForColor } from "../api/products";
import { useApp } from "../context/AppContext";

const EditOrder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useApp();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // Form states
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (!user) {
            navigate("/signin");
            return;
        }

        const getOrderDetails = async () => {
            try {
                setIsLoading(true);
                const response = await fetchOrderById(id);
                if (response.success) {
                    const data = response.data;
                    if (data.status !== 'PENDING') {
                        setError("Only pending orders can be modified.");
                        setOrder(data);
                        return;
                    }
                    setOrder(data);
                    setPhone(data.phone || data.billingInfo?.phone || "");
                    setNotes(data.notes || "");
                    setAddress(data.shippingAddress?.address || "");
                    setCity(data.shippingAddress?.city || "");
                    setItems(data.items.map(item => ({
                        id: item.id,
                        productId: item.productId,
                        productVariantId: item.productVariantId,
                        productName: item.productName || item.product?.title,
                        quantity: item.quantity,
                        priceAtPurchase: item.priceAtPurchase,
                        product: item.product,
                        color: item.color,
                        size: item.size,
                        stock: item.productVariant?.stock ?? 999
                    })));
                } else {
                    setError(response.message || "Failed to fetch order details");
                }
            } catch (err) {
                console.error("Error fetching order details:", err);
                setError("An unexpected error occurred");
            } finally {
                setIsLoading(false);
            }
        };

        getOrderDetails();
    }, [id, user, navigate]);

    const handleQuantityChange = (itemId, newQty) => {
        if (newQty < 1) return;
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            const maxQty = item.stock ?? 999;
            const qty = Math.min(Math.max(1, newQty), maxQty);
            return { ...item, quantity: qty };
        }));
    };

    const handleRemoveItem = (itemId) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleCancelOrder = async () => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            setIsSaving(true);
            const res = await cancelOrder(id);
            if (res.success) {
                navigate("/account?tab=orders");
                return;
            }
            setError(res.message || "Failed to cancel order");
        } catch (err) {
            setError(err.message || "Failed to cancel order");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            // If user removed all items → backend will delete the order
            if (items.length === 0) {
                const itemsRes = await updateOrderItems(id, []);
                if (itemsRes.success && itemsRes.deleted) {
                    navigate("/account?tab=orders");
                    return;
                }
                throw new Error(itemsRes.message || "Failed to update order");
            }

            // 1. Update Details
            const detailsRes = await updateOrderDetails(id, {
                phone,
                notes,
                shippingAddress: {
                    address,
                    city,
                    country: order.shippingAddress?.country || "Egypt"
                },
                billingInfo: {
                    ...order.billingInfo,
                    phone
                }
            });

            if (!detailsRes.success) {
                throw new Error(detailsRes.message || "Failed to update order details");
            }

            // 2. Update Items
            const itemsRes = await updateOrderItems(id, items.map(item => ({
                productId: item.productId,
                productVariantId: item.productVariantId,
                productName: item.productName,
                quantity: item.quantity,
                priceAtPurchase: item.priceAtPurchase,
                color: item.color,
                size: item.size
            })));

            if (!itemsRes.success) {
                throw new Error(itemsRes.message || "Failed to update order items");
            }

            navigate("/account?tab=orders");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
                <p className="text-gray-600 mb-8">{error}</p>
                <Link to="/account" className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                    Back to Account
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
            <nav className="mb-8 text-sm text-gray-500">
                <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
                <span className="mx-2">›</span>
                <Link to="/account" className="hover:text-gray-900 transition-colors">My Account</Link>
                <span className="mx-2">›</span>
                <Link to={`/account/orders/${id}`} className="hover:text-gray-900 transition-colors">Order Details</Link>
                <span className="mx-2">›</span>
                <span className="text-gray-900">Edit Order</span>
            </nav>

            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Order</h1>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-8 text-left">
                    {/* Shipping Info Section */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Information</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Address</label>
                                <input
                                    type="text"
                                    required
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                <input
                                    type="text"
                                    required
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Order Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
                        <div className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <div key={item.id} className="py-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                    <div className="w-20 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                        {getProductImageForColor(item.product, item.color) ? (
                                            <img
                                                src={getProductImageForColor(item.product, item.color)}
                                                alt={item.productName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h3 className="font-semibold text-gray-900 text-lg truncate">{item.productName}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {[item.color, item.size].filter(Boolean).join(' / ')}
                                        </p>
                                        <p className="text-blue-600 font-bold mt-2">{parseFloat(item.priceAtPurchase).toFixed(2)} EGP</p>
                                    </div>
                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                    className="px-3 py-2 hover:bg-gray-100 text-gray-600 border-r border-gray-200"
                                                >-</button>
                                                <span className="px-4 py-2 font-semibold min-w-[40px] text-center">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                    disabled={(item.stock ?? 999) <= item.quantity}
                                                    className="px-3 py-2 hover:bg-gray-100 text-gray-600 border-l border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >+</button>
                                            </div>
                                            <span className="text-sm text-gray-500">Max: {item.stock ?? "—"}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            title="Remove Item"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : items.length === 0 ? "Delete Order (no items)" : "Save Modifications"}
                        </button>
                        {order?.status === "PENDING" && (
                            <button
                                type="button"
                                onClick={handleCancelOrder}
                                disabled={isSaving}
                                className="w-full sm:w-auto px-10 py-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all border border-red-200 disabled:opacity-50"
                            >
                                Cancel Order
                            </button>
                        )}
                        <Link
                            to={`/account/orders/${id}`}
                            className="w-full sm:w-auto px-10 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-center"
                        >
                            Back (don't save)
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditOrder;
