import { Link, useSearchParams } from 'react-router-dom';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        {/* Error Icon */}
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
          Payment Failed
        </h1>
        
        <p className="text-gray-600 mb-6">
          Unfortunately, your payment could not be processed. Please try again or choose a different payment method.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-700 text-sm">
            No money has been deducted from your account. If you see any charges, they will be automatically refunded.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {orderId ? (
            <Link
              to={`/payment?orderId=${orderId}`}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 transition-colors"
            >
              Try Again
            </Link>
          ) : (
            <Link
              to="/cart"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 transition-colors"
            >
              Return to Cart
            </Link>
          )}
          <Link
            to="/contact"
            className="border-2 border-gray-300 text-gray-700 font-semibold px-6 py-3 hover:bg-gray-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
