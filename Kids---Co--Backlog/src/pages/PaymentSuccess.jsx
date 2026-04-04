import { Link, useSearchParams } from 'react-router-dom';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
          Payment Successful!
        </h1>

        <p className="text-gray-600 mb-2">
          Thank you for your purchase. Your payment has been processed successfully.
        </p>



        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <p className="text-green-700 text-sm">
            A confirmation email has been sent to your email address with the order details.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {orderId && (
            <Link
              to={`/account/orders/${orderId}`}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 transition-colors"
            >
              View Order Details
            </Link>
          )}
          <Link
            to="/shop"
            className="border-2 border-gray-300 text-gray-700 font-semibold px-6 py-3 hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
