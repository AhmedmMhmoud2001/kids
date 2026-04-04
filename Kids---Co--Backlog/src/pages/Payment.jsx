import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getPaymentMethods, initPaymobCardPayment, initPaymobWalletPayment, createStripePaymentIntent, getPaymentStatus } from '../api/payment';

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);

  // Wallet payment state
  const [walletPhone, setWalletPhone] = useState('');

  useEffect(() => {
    if (!orderId) {
      navigate('/cart');
      return;
    }
    loadPaymentData();
  }, [orderId]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const statusRes = await getPaymentStatus(orderId);
      if (statusRes.success) {
        setOrderData(statusRes.data);
        if (statusRes.data.orderStatus === 'PAID') {
          navigate(`/payment-success?orderId=${orderId}`);
        }
      }
    } catch (err) {
      console.error('Error loading payment data:', err);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      let result;

      switch (selectedMethod) {
        case 'stripe':
          result = await createStripePaymentIntent(orderId);
          if (result.success) {
            // Stripe Elements integration would go here
            alert('Stripe payment initiated. Client Secret: ' + result.data.clientSecret?.substring(0, 20) + '...');
          }
          break;

        case 'paymob_card':
          result = await initPaymobCardPayment(orderId, {});
          if (result.success && result.data.iframeUrl) {
            window.location.href = result.data.iframeUrl;
            return;
          }
          break;

        case 'paymob_wallet':
          if (!walletPhone || walletPhone.length < 11) {
            setError('Please enter a valid phone number');
            setProcessing(false);
            return;
          }
          result = await initPaymobWalletPayment(orderId, walletPhone);
          if (result.success && result.data.redirectUrl) {
            window.location.href = result.data.redirectUrl;
            return;
          }
          break;

        default:
          setError('Invalid payment method');
      }

      if (!result?.success) {
        setError(result?.message || 'Payment initialization failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment options...</p>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Order Found</h1>
          <Link to="/checkout" className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold">
            Go to Checkout
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Choose Payment Method</h1>
          <p className="text-gray-600">Select the payment method that suits you</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-4">

            {/* Stripe - International Cards */}
            <div
              onClick={() => setSelectedMethod('stripe')}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${selectedMethod === 'stripe' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${selectedMethod === 'stripe' ? 'border-blue-500' : 'border-gray-300'
                  }`}>
                  {selectedMethod === 'stripe' && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Credit / Debit Card</h3>
                    <div className="flex gap-2">
                      <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">VISA</div>
                      <div className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">MC</div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-1">International credit / debit card</p>
                  <p className="text-gray-400 text-xs">Powered by Stripe - Secure international payments</p>
                </div>
              </div>
            </div>

            {/* Paymob Card - Local Cards */}
            <div
              onClick={() => setSelectedMethod('paymob_card')}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${selectedMethod === 'paymob_card' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${selectedMethod === 'paymob_card' ? 'border-green-500' : 'border-gray-300'
                  }`}>
                  {selectedMethod === 'paymob_card' && (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Local bank card</h3>
                    <div className="flex gap-2">
                      <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded font-bold">Meeza</div>
                      <div className="bg-gray-700 text-white text-xs px-2 py-1 rounded font-bold">Local</div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-1">Local Bank Card (Egypt)</p>
                  <p className="text-gray-400 text-xs">Powered by Paymob - Egyptian bank cards</p>
                </div>
              </div>
            </div>

            {/* Paymob Wallet - Mobile Wallets */}
            <div
              onClick={() => setSelectedMethod('paymob_wallet')}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${selectedMethod === 'paymob_wallet' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${selectedMethod === 'paymob_wallet' ? 'border-red-500' : 'border-gray-300'
                  }`}>
                  {selectedMethod === 'paymob_wallet' && (
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Mobile wallet</h3>
                    <div className="flex gap-2">
                      <div className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">Vodafone</div>
                      <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold">Orange</div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-1">Mobile Wallet (Vodafone Cash, Orange, Etisalat)</p>
                  <p className="text-gray-400 text-xs">Pay from your mobile wallet</p>

                  {/* Phone input for wallet */}
                  {selectedMethod === 'paymob_wallet' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wallet number
                      </label>
                      <input
                        type="tel"
                        value={walletPhone}
                        onChange={(e) => setWalletPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="01012345678"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
                        maxLength={11}
                        dir="ltr"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fawry - Coming Soon or if configured */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 opacity-60">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center mt-1">
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Fawry</h3>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">Coming soon</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-1">Fawry Reference Code</p>
                  <p className="text-gray-400 text-xs">Pay at any Fawry outlet</p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Order summary</h2>

              <div className="space-y-3 mb-6">

                {orderData && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-medium ${orderData.orderStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                        {orderData.orderStatus === 'PENDING' ? 'Awaiting payment' : orderData.orderStatus}
                      </span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-blue-600">
                        {Number(orderData.amount).toFixed(2)} EGP
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={!selectedMethod || processing}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all ${!selectedMethod || processing
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                  }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Processing...
                  </span>
                ) : (
                  <>Pay now</>
                )}
              </button>

              {/* Security badges */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure Payment</span>
                </div>
                <div className="flex justify-center gap-3 flex-wrap">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500">SSL</span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500">PCI DSS</span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500">3D Secure</span>
                </div>
              </div>

              {/* Back link */}
              <Link
                to="/checkout"
                className="block text-center text-gray-500 hover:text-gray-700 text-sm mt-4"
              >
                ← Back to checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
