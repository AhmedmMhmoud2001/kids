import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';
import BottomNav from './BottomNav';
import CartSidebar from '../cart/CartSidebar';
import { useApp } from '../../context/AppContext';

const Layout = () => {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateCartQuantity } = useApp();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Navigation />
      <main className="flex-grow pb-20 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cartItems}
        onRemove={removeFromCart}
        onQuantityChange={updateCartQuantity}
      />
    </div>
  );
};

export default Layout;

