import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { validateCoupon } from "../api/coupons";

const Cart = () => {
  const {
    cartItems,
    updateCartQuantity,
    removeFromCart,
    cartTotal,
    appliedCoupon,
    setAppliedCoupon,
    removeCoupon,
    user
  } = useApp();

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartQuantity(id, newQuantity);
  };

  const removeItem = (id) => {
    removeFromCart(id);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await validateCoupon(couponCode, cartTotal);
      if (res.success) {
        setAppliedCoupon(res.data);
        setCouponCode("");
      }
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const finalTotal = appliedCoupon
    ? cartTotal - Number(appliedCoupon.discount || 0)
    : cartTotal;

  return (
    <div className="container mx-auto px-3 sm:px-6 md:px-10 lg:px-20 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-900">
          Home
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">Cart</span>
      </nav>

      {cartItems.length === 0 ? (
        /* Empty Cart - Centered */
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          {/* Table Header - Desktop only */}
          <div className="w-full max-w-5xl mb-8">
            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b font-semibold text-sm">
              <div className="col-span-1"></div>
              <div className="col-span-11">Product</div>
            </div>
          </div>

          {/* Empty Cart Message */}
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500 mb-4">
              Start adding products to your cart!
            </p>
            <Link
              to="/shop"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg">
              {/* Table Header (Desktop only) */}
              <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b font-semibold text-sm">
                <div className="col-span-1"></div>
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>

              {/* Cart Items */}
              <div className="divide-y text-sm">
                {cartItems.map((item) => {
                  let price = 0;
                  if (typeof item.price === 'number' && !Number.isNaN(item.price)) {
                    price = item.price;
                  } else if (typeof item.price === 'string') {
                    price = parseFloat(item.price.replace(/[^0-9.]/g, "") || 0);
                  } else {
                    price = Number(item.price) || 0;
                  }
                  const itemSubtotal = price * item.quantity;
                  const itemId = item.cartItemId ?? `${item.id}_${item.selectedSize ?? ''}_${item.selectedColor ?? ''}`;

                  return (
                    <div
                      key={itemId}
                      className="
                        py-4
                        flex flex-col gap-3
                        md:grid md:grid-cols-12 md:gap-4 md:items-center md:py-6
                      "
                    >
                      {/* Row 1 (mobile): remove + product */}
                      <div className="flex items-start justify-between gap-3 md:contents">
                        {/* Remove Button */}
                        <div className="md:col-span-1 flex justify-end md:justify-start">
                          <button
                            onClick={() => removeItem(itemId)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Remove item"
                          >
                            <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Product Info */}
                        <div className="md:col-span-5 flex gap-3 sm:gap-4 flex-1">
                          <img
                            src={item.image || null}
                            alt={item.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="min-w-0 flex flex-col justify-center">
                            <h3 className="font-medium text-gray-900 line-clamp-2">
                              {item.name}
                            </h3>
                            {item.selectedSize && (
                              <p className="text-xs text-gray-500 mt-1">Size: {item.selectedSize}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Details (mobile stacked) + Desktop columns */}
                      <div className="grid grid-cols-2 gap-3 md:contents">
                        {/* Price */}
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-400 md:hidden uppercase tracking-wider mb-1">
                            Price
                          </p>
                          <span className="text-gray-700 font-medium">
                            {price.toFixed(2)} EGP
                          </span>
                        </div>

                        {/* Quantity */}
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-400 md:hidden uppercase tracking-wider mb-1">
                            Quantity
                          </p>
                          <div className="flex items-center border border-gray-200 rounded w-fit bg-white">
                            <button
                              onClick={() =>
                                updateQuantity(itemId, item.quantity - 1)
                              }
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="w-10 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(itemId, item.quantity + 1)
                              }
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-2 md:col-span-2 md:text-right">
                          <p className="text-xs text-gray-400 md:hidden uppercase tracking-wider mb-1">
                            Subtotal
                          </p>
                          <span className="text-blue-600 font-bold">
                            {itemSubtotal.toFixed(2)} EGP
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart Totals */}
          <div className="lg:col-span-1 lg:sticky lg:top-6 h-fit">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Summary</h2>

              <div className="space-y-4 text-sm sm:text-base">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{cartTotal.toFixed(2)} EGP</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium bg-emerald-50 p-2 rounded-lg">
                    <div className="flex flex-col">
                      <span>Discount ({appliedCoupon.code})</span>
                      <button
                        onClick={removeCoupon}
                        className="text-[10px] uppercase tracking-wider underline text-red-500 text-left mt-1 hover:text-red-700"
                      >
                        Remove Coupon
                      </button>
                    </div>
                    <span>-{Number(appliedCoupon.discount || 0).toFixed(2)} EGP</span>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-black text-blue-600">
                      {finalTotal.toFixed(2)} EGP
                    </span>
                  </div>
                </div>
              </div>

              {/* Coupon Code */}
              {!appliedCoupon && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-900 mb-3">Promotional Code</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter Code"
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    />
                    <button
                      disabled={couponLoading || !couponCode}
                      onClick={handleApplyCoupon}
                      className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="mt-2 text-xs text-red-500 font-medium">{couponError}</p>
                  )}
                </div>
              )}

              {/* Checkout Button */}
              <Link
                to={user ? "/checkout" : "/signin?redirect=/checkout"}
                className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-center transition-all shadow-lg hover:shadow-blue-200 active:scale-95 text-lg"
              >
                Go to Checkout
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6 px-4">
              Taxes and shipping are calculated at checkout. By clicking "Go to Checkout" you agree to our terms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
