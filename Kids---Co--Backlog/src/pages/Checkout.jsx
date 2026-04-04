import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { createOrder } from '../api/orders';
import { API_BASE_URL } from '../api/config';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, appliedCoupon, user, clearCart, setAppliedCoupon } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/signin?redirect=/checkout');
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    // Billing Information
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',

    // Shipping Address
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Egypt',

    // Payment
    paymentMethod: 'COD',

    // Additional
    orderNotes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [shipping, setShipping] = useState(150); // Default/fallback

  useEffect(() => {
    const getShipping = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/shipping_fee`);
        const result = await response.json();
        if (result.success && result.data) {
          setShipping(parseFloat(result.data.value));
        }
      } catch (error) {
        console.error('Failed to fetch shipping fee:', error);
      }
    };
    getShipping();
  }, []);

  const discount = appliedCoupon ? Number(appliedCoupon.discount || 0) : 0;
  const total = cartTotal + shipping - discount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const orderData = {
      items: cartItems.map(item => {
        const price = typeof item.price === 'number' && !Number.isNaN(item.price)
          ? item.price
          : (typeof item.price === 'string' ? parseFloat(String(item.price).replace(/[^0-9.]/g, '')) : Number(item.price)) || 0;
        return {
          productId: item.id,
          quantity: item.quantity,
          price,
          color: item.selectedColor ?? item.color ?? null,
          size: item.selectedSize ?? item.size ?? null,
          productVariantId: item.productVariantId ?? null
        };
      }),
      paymentMethod: formData.paymentMethod,
      notes: formData.orderNotes,
      billingInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      },
      shippingAddress: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country
      },
      shippingFee: shipping,
      discount: discount,
      couponCode: appliedCoupon ? appliedCoupon.code : null
    };

    console.log('Sending order data:', orderData);

    try {
      const response = await createOrder(orderData);
      console.log('Order response:', response);
      if (response.success) {
        clearCart();
        setAppliedCoupon(null);

        // If CARD payment, redirect to payment page
        if (formData.paymentMethod === 'CARD') {
          const orderId = response.data?.id || response.data?.order?.id;
          navigate(`/payment?orderId=${orderId}`);
        } else {
          // COD - go to orders page
          navigate('/account?tab=orders');
        }
      } else {
        setError(response.message || 'Failed to place order');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link to="/shop" className="text-blue-500 underline">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-900">Home</Link>
        <span className="mx-2">›</span>
        <Link to="/cart" className="hover:text-gray-900">Cart</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">Checkout</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Billing Information */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Billing Information</h2>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+20 123 456 7890"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Cairo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Cairo Governorate"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Zip/Postal Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Egypt">Egypt</option>
                      <option value="UAE">UAE</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Kuwait">Kuwait</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Payment Method</h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={formData.paymentMethod === 'CARD'}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">Credit/Debit Card</div>
                    <div className="text-sm text-gray-600">Pay securely with your card</div>
                  </div>
                  <div className="flex gap-2">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M2 8h20" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">Cash on Delivery</div>
                    {/* <div className="text-sm text-gray-600">Pay when you receive your order</div> */}
                  </div>
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </label>
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Order Notes (Optional)</h2>
              <textarea
                name="orderNotes"
                value={formData.orderNotes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions for your order..."
              />
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.image || null}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium line-clamp-2">{item.name}</h3>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold text-blue-500">{item.price + ' EGP'}</p>
                  </div>
                </div>
              ))}
            </div>

            <hr className="my-4" />

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">{cartTotal.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className="font-medium text-gray-900">{shipping.toFixed(2)} EGP</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-{Number(appliedCoupon.discount || 0).toFixed(2)} EGP</span>
                </div>
              )}

              <hr />
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span className="text-blue-600">{total.toFixed(2)} EGP</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Place Order Button */}
            <button
              form="checkout-form"
              type="submit"
              disabled={loading}
              className={`block w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-200 active:scale-95 text-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading
                ? 'Processing...'
                : formData.paymentMethod === 'CARD'
                  ? 'Continue to Payment'
                  : 'Place Order'}
            </button>

            {/* Security Note */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure checkout powered by SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

