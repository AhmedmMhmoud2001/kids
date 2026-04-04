import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';
import ScrollToTop from './components/common/ScrollToTop';
import ErrorBoundary from './components/common/ErrorBoundary';
import Home from './pages/Home';
import Home2 from './pages/Home2';
import Shop from './pages/Shop';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import Favorites from './pages/Favorites';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OAuthCallback from './pages/OAuthCallback';
import Account from './pages/Account';
import About from './pages/About';
import FAQs from './pages/FAQs';
import Contact from './pages/Contact';
import Delivery from './pages/Delivery';
import Brands from './pages/Brands';
import OrderDetails from './pages/OrderDetails';
import Invoice from './pages/Invoice';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import EditOrder from './pages/EditOrder';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/dashboard/DashboardLayout';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <Router>
            <AppProvider>
              <ScrollToTop />
              <Routes>
          {/* Main Layout - with Header, Navigation, Footer */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="home2" element={<Home2 />} />
            <Route path="shop" element={<Shop />} />
            <Route path="category/:category" element={<Category />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="payment" element={<Payment />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
            <Route path="payment-failed" element={<PaymentFailed />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="account" element={<Account />} />
            <Route path="about" element={<About />} />
            <Route path="faqs" element={<FAQs />} />
            <Route path="contact" element={<Contact />} />
            <Route path="delivery" element={<Delivery />} />
            <Route path="brands" element={<Brands />} />
            <Route path="terms" element={<TermsAndConditions />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="account/orders/:id" element={<OrderDetails />} />
            <Route path="account/orders/:id/edit" element={<EditOrder />} />
            <Route path="account/orders/:id/invoice" element={<Invoice />} />
            <Route path="dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Dashboard />} />
              <Route path="products" element={<Dashboard />} />
              <Route path="customers" element={<Dashboard />} />
              <Route path="promotions" element={<Dashboard />} />
              <Route path="categories" element={<Dashboard />} />
              <Route path="reports" element={<Dashboard />} />
              <Route path="settings" element={<Dashboard />} />
            </Route>
          </Route>

          {/* Auth Layout - Simple layout for auth pages */}
          <Route element={<AuthLayout />}>
            <Route path="signin" element={<SignIn />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="oauth-callback" element={<OAuthCallback />} />
          </Route>
              </Routes>
            </AppProvider>
          </Router>
        </LanguageProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
