
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getColorSwatchStyle } from '../../api/products';

const CartSidebar = ({ isOpen, onClose, items, onRemove, onQuantityChange }) => {
  const navigate = useNavigate();
  const { user } = useApp();

  // Disable body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Calculate subtotal (price may be number or string)
  const getPrice = (p) => (typeof p === 'number' && !Number.isNaN(p)) ? p : parseFloat(String(p || 0).replace(/[^0-9.]/g, '')) || 0;
  const subtotal = items.reduce((total, item) => {
    const price = getPrice(item.price);
    return total + (price * (item.quantity || 1));
  }, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-[101] flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Shopping Cart ({items.length})</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Your cart is empty</p>
              <button
                onClick={onClose}
                className="text-blue-500 font-medium hover:text-blue-600 hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId ?? `${item.id}_${item.selectedSize ?? ''}_${item.selectedColor ?? ''}`} className="flex gap-4 p-2 hover:bg-gray-50 transition-colors border-b last:border-0 pb-4 last:pb-2">
                {/* Product Image - Sharp */}
                <div className="w-20 h-24 shrink-0 overflow-hidden border border-gray-100">
                  <img
                    src={item.image || null}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                      <button
                        onClick={() => onRemove(item.cartItemId ?? `${item.id}_${item.selectedSize ?? ''}_${item.selectedColor ?? ''}`)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    {(item.selectedSize || item.size) && <p className="text-xs text-gray-500 mt-1">Size: {item.selectedSize ?? item.size}</p>}
                    {(item.selectedColor || item.color) && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-gray-500">Color:</span>
                        <div className="w-3 h-3 border border-gray-200 rounded shrink-0" style={getColorSwatchStyle(item.selectedColor ?? item.color)} title={item.selectedColor ?? item.color} />
                        <span className="text-xs text-gray-600">{item.selectedColor ?? item.color}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border">
                      <button
                        onClick={() => onQuantityChange(item.cartItemId ?? `${item.id}_${item.selectedSize ?? ''}_${item.selectedColor ?? ''}`, Math.max(1, (item.quantity || 1) - 1))}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        disabled={(item.quantity || 1) <= 1}
                      >
                        -
                      </button>
                      <span className="px-2 text-sm w-8 text-center">{item.quantity || 1}</span>
                      <button
                        onClick={() => onQuantityChange(item.cartItemId ?? `${item.id}_${item.selectedSize ?? ''}_${item.selectedColor ?? ''}`, (item.quantity || 1) + 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-semibold text-blue-500">
                      {getPrice(item.price).toFixed(2)} EGP
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4 bg-gray-50">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Subtotal</span>
              <span className="text-blue-500">{subtotal.toFixed(2)} EGP</span>
            </div>
            <p className="text-xs text-gray-500 text-center">Shipping and taxes calculated at checkout.</p>

            <div className="space-y-3">
              <Link
                to="/cart"
                onClick={onClose}
                className="block w-full border-2 border-gray-900 text-gray-900 font-bold py-3 text-center hover:bg-gray-900 hover:text-white transition-colors"
              >
                VIEW CART
              </Link>
              <button
                onClick={() => {
                  onClose();
                  navigate(user ? '/checkout' : '/signin?redirect=/checkout');
                }}
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 text-center transition-colors"
              >
                CHECKOUT
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
