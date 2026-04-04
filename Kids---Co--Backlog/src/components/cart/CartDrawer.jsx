
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const CartDrawer = () => {
    const navigate = useNavigate();
    const {
        isCartOpen,
        setIsCartOpen,
        cartItems,
        removeFromCart,
        updateCartQuantity,
        cartTotal,
        user
    } = useApp();

    // Close drawer when pressing Escape
    useEffect(() => {
        const handleEscKey = (e) => {
            if (e.key === 'Escape' && isCartOpen) {
                setIsCartOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isCartOpen, setIsCartOpen]);

    // Disable body scroll when drawer is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isCartOpen]);

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col h-full animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold">Shopping Cart ({cartItems.length})</h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mb-2">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 font-medium">Your cart is empty</p>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="text-blue-500 font-medium hover:text-blue-600 hover:underline"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.id} className="flex gap-4 p-2 hover:bg-gray-50 transition-colors border-b last:border-0 pb-4 last:pb-2">
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
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        {item.size && <p className="text-xs text-gray-500 mt-1">Size: {item.size}</p>}
                                        {item.color && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-xs text-gray-500">Color:</span>
                                                <div className="w-3 h-3 border border-gray-200" style={{ backgroundColor: item.color }}></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center border">
                                            <button
                                                onClick={() => updateCartQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                                disabled={item.quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="px-2 text-sm w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="font-semibold text-blue-500">
                                            {item.price}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="border-t p-4 space-y-4 bg-gray-50">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Subtotal</span>
                            <span className="text-blue-500">{cartTotal.toFixed(2)} EE</span>
                        </div>
                        <p className="text-xs text-gray-500 text-center">Shipping and taxes calculated at checkout.</p>

                        <div className="space-y-3">
                            <Link
                                to="/cart"
                                onClick={() => setIsCartOpen(false)}
                                className="block w-full border-2 border-gray-900 text-gray-900 font-bold py-3 text-center hover:bg-gray-900 hover:text-white transition-colors"
                            >
                                VIEW CART
                            </Link>
                            <button
                                onClick={() => {
                                    setIsCartOpen(false);
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
        </div>
    );
};

export default CartDrawer;
