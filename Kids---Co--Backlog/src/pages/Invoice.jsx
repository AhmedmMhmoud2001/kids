import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchOrderById } from "../api/orders";
import { useApp } from "../context/AppContext";

const Invoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/signin");
      return;
    }
    const loadOrder = async () => {
      try {
        setLoading(true);
        const response = await fetchOrderById(id);
        if (response.success) {
          setOrder(response.data);
        } else {
          setError(response.message || "Failed to load invoice");
        }
      } catch (err) {
        console.error("Error loading invoice:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id, user, navigate]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; direction: ltr; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .invoice-title { font-size: 28px; font-weight: bold; }
            .meta { margin-top: 8px; color: #6b7280; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 24px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f9fafb; font-weight: bold; }
            .totals { margin-top: 24px; text-align: right; }
            .totals table { max-width: 320px; margin-right: auto; }
            .total-row { font-size: 18px; font-weight: bold; }
            .address { margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; }
            .address h3 { margin-bottom: 8px; font-size: 14px; }
            .address p { font-size: 14px; color: #374151; }
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

  if (!user) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Invoice Not Available</h2>
        <p className="text-gray-600 mb-8">{error || "This invoice could not be found."}</p>
        <Link
          to="/account?tab=orders"
          className="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          Back to Orders
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-900">Home</Link>
        <span className="mx-2">›</span>
        <Link to="/account?tab=orders" className="hover:text-gray-900">My Orders</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">Invoice</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoice</h1>
        <div className="flex items-center gap-3">
          <Link
            to={`/account/orders/${order.id}`}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Order Details
          </Link>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2h-2m-4-1v8m-4 0l4-4m0 0l4 4m-4-4v4" />
            </svg>
            Print Invoice
          </button>
        </div>
      </div>

      <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 md:p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 pb-6 mb-6 border-b-2 border-gray-100">
          <div>
            <div className="text-2xl font-bold text-blue-600 mb-1">Kids Co</div>
            <p className="text-sm text-gray-500">Sales Invoice</p>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-xl font-bold text-gray-900">Invoice</h2>
            <p className="text-sm text-gray-500 mt-1">Date: {orderDate}</p>
            <p className="text-sm text-gray-500">Status: {order.status}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8 pb-6 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Customer Details</h3>
            <p className="text-gray-900 font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-gray-600">{user.email}</p>
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

        {/* Items table */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-sm font-bold text-gray-700">#</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700">Product</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700">Quantity</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700">Price</th>
              <th className="py-3 px-4 text-sm font-bold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-4 px-4 text-gray-600">{index + 1}</td>
                <td className="py-4 px-4 font-medium text-gray-900">
                  {item.productName || item.product?.title || "—"}
                  {(item.color || item.size) && (
                    <span className="block text-sm text-gray-500 font-normal">
                      {[item.color, item.size].filter(Boolean).join(" / ")}
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-gray-600">{item.quantity}</td>
                <td className="py-4 px-4 text-gray-600">{parseFloat(item.priceAtPurchase || 0).toFixed(2)} EGP</td>
                <td className="py-4 px-4 font-medium text-gray-900">
                  {(parseFloat(item.priceAtPurchase || 0) * item.quantity).toFixed(2)} EGP
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-8 flex justify-end">
          <table className="w-full max-w-xs">
            <tbody>
              <tr>
                <td className="py-2 text-gray-600">Subtotal</td>
                <td className="py-2 text-right font-medium">{parseFloat(order.subtotal || 0).toFixed(2)} EGP</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Shipping</td>
                <td className="py-2 text-right font-medium">{parseFloat(order.shippingFee || 0).toFixed(2)} EGP</td>
              </tr>
              {parseFloat(order.discount || 0) > 0 && (
                <tr>
                  <td className="py-2 text-green-600">Discount</td>
                  <td className="py-2 text-right font-medium text-green-600">-{parseFloat(order.discount).toFixed(2)} EGP</td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-200">
                <td className="py-3 font-bold text-gray-900">Total</td>
                <td className="py-3 text-right text-xl font-bold text-blue-600">{parseFloat(order.totalAmount).toFixed(2)} EGP</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Method */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Payment Method</h3>
          <p className="text-gray-600 text-sm">{order.paymentMethod === "COD" ? "Cash On Delivery" : "Credit Card"}</p>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          <p className="mt-1">Kids Co - Quality Products for Kids & Teens</p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
