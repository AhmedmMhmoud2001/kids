import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { fetchOrderById } from '../api/orders';

const InvoiceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const printRef = useRef(null);

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const response = await fetchOrderById(id);
            if (response.success) {
                setOrder(response.data);
            } else {
                setError('Failed to load invoice');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Invoice #${order?.id || id}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: Arial, sans-serif; padding: 24px; color: #111; direction: ltr; }
                        .invoice { max-width: 800px; margin: 0 auto; }
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
                        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
                        .invoice-title { font-size: 28px; font-weight: bold; }
                        .meta { margin-top: 8px; color: #6b7280; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
                        th, td { padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; }
                        th { background: #f9fafb; font-weight: bold; }
                        .totals { margin-top: 24px; text-align: left; }
                        .totals table { max-width: 320px; margin-left: auto; }
                        .total-row { font-size: 18px; font-weight: bold; }
                        .address { margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; }
                        .address h3 { margin-bottom: 8px; font-size: 14px; }
                        .address p { font-size: 14px; color: #374151; }
                        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
                        .admin-note { background: #fef3c7; border: 1px solid #fbbf24; padding: 12px; border-radius: 8px; margin-top: 16px; }
                    </style>
                </head>
                <body>
                    ${content.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                <p className="mt-4 text-gray-600">Loading invoice...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Invoice Not Found</h2>
                <p className="text-gray-600 mb-8">{error || 'Unable to load this invoice.'}</p>
                <button
                    onClick={() => navigate('/invoices')}
                    className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Invoices
                </button>
            </div>
        );
    }

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            case 'PENDING': return 'bg-amber-100 text-amber-800';
            case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800';
            case 'CANCELED': return 'bg-red-100 text-red-800';
            case 'RETURNED': return 'bg-orange-100 text-orange-800';
            case 'SHIPPED': return 'bg-purple-100 text-purple-800';
            case 'PAID': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/invoices')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Invoices
                </button>
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                >
                    <Printer size={20} />
                    Print Invoice
                </button>
            </div>

            {/* Admin View Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Admin View:</strong> This is the official invoice for this order.
                    You can print or download this for record-keeping or customer support.
                </p>
            </div>

            {/* Invoice Content */}
            <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 md:p-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 pb-6 mb-6 border-b-2 border-gray-100">
                    <div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">Kids & Co</div>
                        <p className="text-sm text-gray-500">Sales Invoice</p>
                    </div>
                    <div className="text-left sm:text-right">
                        <h2 className="text-2xl font-bold text-gray-900">Sales Invoice</h2>
                        <p className="text-sm text-gray-500 mt-1">Date: {orderDate}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {order.status}
                        </span>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="grid sm:grid-cols-2 gap-6 mb-8 pb-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Customer Details</h3>
                        <p className="text-gray-900 font-semibold">
                            {order.user?.firstName} {order.user?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{order.user?.email}</p>
                        {(order.phone || order.billingInfo?.phone) && (
                            <p className="text-sm text-gray-600 mt-1">
                                Phone: {order.phone || order.billingInfo?.phone}
                            </p>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Shipping Address</h3>
                        <p className="text-sm text-gray-600">
                            {order.shippingAddress?.address}<br />
                            {order.shippingAddress?.city}, {order.shippingAddress?.country}
                        </p>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-right border-collapse mb-8">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="py-3 px-4 text-sm font-bold text-gray-700">#</th>
                            <th className="py-3 px-4 text-sm font-bold text-gray-700">Product</th>
                            <th className="py-3 px-4 text-sm font-bold text-gray-700">Qty</th>
                            <th className="py-3 px-4 text-sm font-bold text-gray-700">Price</th>
                            <th className="py-3 px-4 text-sm font-bold text-gray-700">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item, index) => (
                            <tr key={item.id} className="border-b border-gray-100">
                                <td className="py-4 px-4 text-gray-600">{index + 1}</td>
                                <td className="py-4 px-4 font-medium text-gray-900">
                                    {item.productName || item.product?.title || '—'}
                                    {(item.color || item.size) && (
                                        <span className="block text-sm text-gray-500 font-normal">
                                            {[item.color, item.size].filter(Boolean).join(' / ')}
                                        </span>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-gray-600">{item.quantity}</td>
                                <td className="py-4 px-4 text-gray-600">
                                    {parseFloat(item.priceAtPurchase || 0).toFixed(2)} EGP
                                </td>
                                <td className="py-4 px-4 font-medium text-gray-900">
                                    {(parseFloat(item.priceAtPurchase || 0) * item.quantity).toFixed(2)} EGP
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-start">
                    <table className="w-full max-w-sm">
                        <tbody>
                            <tr>
                                <td className="py-2 text-gray-600">Subtotal</td>
                                <td className="py-2 text-left font-medium">
                                    {parseFloat(order.subtotal || 0).toFixed(2)} EGP
                                </td>
                            </tr>
                            <tr>
                                <td className="py-2 text-gray-600">Shipping</td>
                                <td className="py-2 text-left font-medium">
                                    {parseFloat(order.shippingFee || 0).toFixed(2)} EGP
                                </td>
                            </tr>
                            {parseFloat(order.discount || 0) > 0 && (
                                <tr>
                                    <td className="py-2 text-green-600">Discount</td>
                                    <td className="py-2 text-left font-medium text-green-600">
                                        -{parseFloat(order.discount).toFixed(2)} EGP
                                    </td>
                                </tr>
                            )}
                            <tr className="border-t-2 border-gray-200">
                                <td className="py-3 font-bold text-gray-900">Total</td>
                                <td className="py-3 text-left text-xl font-bold text-blue-600">
                                    {parseFloat(order.totalAmount).toFixed(2)} EGP
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Payment Method */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">Payment Method</h3>
                    <p className="text-gray-900">
                        {order.paymentMethod === 'COD' ? 'Cash On Delivery' : 'Credit Card'}
                    </p>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Order Notes</h3>
                        <p className="text-sm text-gray-700">{order.notes}</p>
                    </div>
                )}

                {/* Cancellation Reason */}
                {order.status === 'CANCELED' && order.cancelReason && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h3 className="text-sm font-bold text-red-700 mb-2">Cancellation Reason</h3>
                        <p className="text-sm text-red-700">{order.cancelReason}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-10 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
                    <p>Thank you for your business!</p>
                    <p className="mt-1">Kids & Co - Quality Products for Kids & Teens</p>
                </div>
            </div>
        </div>
    );
};

export default InvoiceView;
