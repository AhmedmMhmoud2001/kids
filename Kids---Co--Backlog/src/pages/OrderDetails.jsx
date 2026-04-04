import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchOrderById, requestReturn } from "../api/orders";
import { getProductFirstImage, getProductImageForColor } from "../api/products";
import { useApp } from "../context/AppContext";

const RETURN_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useApp();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [returnLoading, setReturnLoading] = useState(false);
    const [returnError, setReturnError] = useState(null);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReasonInput, setReturnReasonInput] = useState("");

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
                    setOrder(response.data);
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

    // Use deliveredAt if set, else updatedAt for DELIVERED orders (e.g. old orders before deliveredAt existed)
    const deliveredAtRaw = order?.deliveredAt ?? (order?.status === "DELIVERED" ? order?.updatedAt : null);
    const deliveredAt = deliveredAtRaw ? new Date(deliveredAtRaw) : null;
    const msSinceDelivery = deliveredAt ? Date.now() - deliveredAt.getTime() : 0;
    // Can request return only within 24h of delivery; after 24h no longer allowed
    const canRequestReturn = order?.status === "DELIVERED" && deliveredAt && msSinceDelivery <= RETURN_WINDOW_MS;
    const returnPeriodEnded = order?.status === "DELIVERED" && deliveredAt && msSinceDelivery > RETURN_WINDOW_MS;
    const showDeliveredAtBadge = order?.status === "DELIVERED" && deliveredAt && msSinceDelivery < RETURN_WINDOW_MS;
    const hoursRemaining = order?.status === "DELIVERED" && deliveredAt && msSinceDelivery < RETURN_WINDOW_MS
        ? Math.max(0, Math.ceil((RETURN_WINDOW_MS - msSinceDelivery) / (60 * 60 * 1000)))
        : null;

    const handleRequestReturn = async (reason = null) => {
        if (!order || !canRequestReturn) return;
        setReturnLoading(true);
        setReturnError(null);
        try {
            const res = await requestReturn(order.id, reason || null);
            if (res.success) {
                setOrder(res.data);
                setShowReturnModal(false);
                setReturnReasonInput("");
            } else {
                setReturnError(res.message || "Failed to request return");
            }
        } catch (err) {
            setReturnError(err.message || "Failed to request return");
        } finally {
            setReturnLoading(false);
        }
    };

    const openReturnModal = () => setShowReturnModal(true);
    const closeReturnModal = () => {
        if (!returnLoading) {
            setShowReturnModal(false);
            setReturnReasonInput("");
        }
    };
    const submitReturnFromModal = () => handleRequestReturn(returnReasonInput.trim() || null);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h2>
                <p className="text-gray-600 mb-8">{error || "The order you are looking for does not exist."}</p>
                <Link
                    to="/account"
                    className="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                    Back to Account
                </Link>
            </div>
        );
    }

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    // نفس ألوان حالة الطلب في الداشبورد
    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING": return "bg-yellow-100 text-yellow-800";
            case "PAID": return "bg-green-100 text-green-800";
            case "CONFIRMED": return "bg-emerald-100 text-emerald-800";
            case "PROCESSING": return "bg-indigo-100 text-indigo-800";
            case "SHIPPED": return "bg-purple-100 text-purple-800";
            case "DELIVERED": return "bg-blue-100 text-blue-800";
            case "RETURNED": return "bg-orange-100 text-orange-800";
            case "REFUNDED": return "bg-amber-100 text-amber-800";
            case "COMPLETED": return "bg-teal-100 text-teal-800";
            case "CANCELED": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
            {/* Breadcrumb */}
            <nav className="mb-8 text-sm text-gray-500">
                <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
                <span className="mx-2">›</span>
                <Link to="/account" className="hover:text-gray-900 transition-colors">My Account</Link>
                <span className="mx-2">›</span>
                <span className="text-gray-900">Order Details</span>
            </nav>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex flex-wrap items-center gap-3 gap-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Details</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {order.status}
                        </span>
                    </div>
                    <p className="text-gray-600 mt-1">Placed on {orderDate}</p>
                </div>
                <div className="flex items-center gap-3">
                    {order.status === 'PENDING' && (
                        <Link
                            to={`/account/orders/${order.id}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Order
                        </Link>
                    )}
                    <Link
                        to={`/account/orders/${order.id}/invoice`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Invoice
                    </Link>
                    {showDeliveredAtBadge && (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-medium border border-blue-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Delivered at {deliveredAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                    )}
                </div>
            </div>

            {order.status === "DELIVERED" && deliveredAt && (
                <div className={`mb-8 p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-4 ${returnPeriodEnded ? 'bg-gray-50 border-gray-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${returnPeriodEnded ? 'bg-gray-200 text-gray-500' : 'bg-emerald-100 text-emerald-600'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className={`font-bold ${returnPeriodEnded ? 'text-gray-700' : 'text-emerald-800'}`}>Return policy</h3>
                        {returnPeriodEnded ? (
                            <p className="text-gray-600 mt-1">Return can only be requested within 24 hours of delivery. The return period has ended.</p>
                        ) : (
                            <p className="text-emerald-700 mt-1">
                                You can request a return within 24 hours of delivery. {hoursRemaining != null && <strong>{hoursRemaining} hour(s) remaining.</strong>}
                            </p>
                        )}
                    </div>
                    {!returnPeriodEnded && (
                        <button
                            type="button"
                            onClick={openReturnModal}
                            disabled={returnLoading}
                            className="self-start sm:self-center inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Request return
                        </button>
                    )}
                </div>
            )}

            {/* Request return modal */}
            {showReturnModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeReturnModal}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Request return</h3>
                        <p className="text-gray-600 text-sm mb-4">Submit a return request for this order. You can optionally add a reason below.</p>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                        <textarea
                            value={returnReasonInput}
                            onChange={(e) => setReturnReasonInput(e.target.value)}
                            placeholder="e.g. damaged item, wrong size"
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            disabled={returnLoading}
                        />
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={submitReturnFromModal}
                                disabled={returnLoading}
                                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                            >
                                {returnLoading ? (
                                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                ) : null}
                                Submit request
                            </button>
                            <button
                                type="button"
                                onClick={closeReturnModal}
                                disabled={returnLoading}
                                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {returnError && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                    {returnError}
                </div>
            )}

            {order.status === "CANCELED" && order.cancelReason && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-red-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 14c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800">Cancellation Message from Support</h3>
                        <p className="text-red-700 mt-1 leading-relaxed">{order.cancelReason}</p>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content: Order Items */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Order Items ({order.items?.length || 0})</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {order.items?.map((item) => (
                                <div key={item.id} className="p-6 flex items-center gap-4 sm:gap-6">
                                    <div className="w-20 h-24 sm:w-24 sm:h-32 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
                                        {getProductImageForColor(item.product, item.color) ? (
                                            <img
                                                src={getProductImageForColor(item.product, item.color)}
                                                alt={item.productName || item.product?.name}
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
                                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                                            {item.productName || item.product?.name || "Product Info Unavailable"}
                                        </h3>
                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                            {item.color && (
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">Color:</span> {item.color}
                                                </span>
                                            )}
                                            {item.size && (
                                                <span className="flex items-center gap-1">
                                                    <span className="font-medium">Size:</span> {item.size}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <span className="font-medium">Qty:</span> {item.quantity}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-blue-600 font-bold text-lg">
                                                {parseFloat(item.priceAtPurchase).toFixed(2)} EGP
                                            </span>
                                            <span className="text-sm text-gray-400">
                                                Subtotal: {(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)} EGP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Order Summary & Info */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Summary Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 font-primary">Order Summary</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{parseFloat(order.subtotal || 0).toFixed(2)} EGP</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping Fees</span>
                                <span>{parseFloat(order.shippingFee || 0).toFixed(2)} EGP</span>
                            </div>
                            {parseFloat(order.discount || 0) > 0 && (
                                <div className="flex justify-between text-green-600 italic">
                                    <span>Discount</span>
                                    <span>-{parseFloat(order.discount).toFixed(2)} EGP</span>
                                </div>
                            )}
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-blue-600">{parseFloat(order.totalAmount).toFixed(2)} EGP</span>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 font-primary">Delivery Information</h2>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Shipping Address</p>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                        {order.shippingAddress?.address}<br />
                                        {order.shippingAddress?.city}, {order.shippingAddress?.country}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Contact Number</p>
                                    <p className="text-sm text-gray-600 mt-1">{order.billingInfo?.phone}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Payment Method</p>
                                    <p className="text-sm text-gray-600 mt-1">{order.paymentMethod === 'COD' ? 'Cash On Delivery' : 'Credit Card'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
