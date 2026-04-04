import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/useApp';
import DashboardLayout from './layout/DashboardLayout';
import PageLoader from './components/common/PageLoader';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load all pages for code splitting
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const KidsProducts = lazy(() => import('./pages/KidsProducts'));
const KidsOrders = lazy(() => import('./pages/KidsOrders'));
const NextProducts = lazy(() => import('./pages/NextProducts'));
const NextOrders = lazy(() => import('./pages/NextOrders'));
const Users = lazy(() => import('./pages/Users'));
const Categories = lazy(() => import('./pages/Categories'));
const CategoryForm = lazy(() => import('./pages/CategoryForm'));
const ProductForm = lazy(() => import('./pages/ProductForm'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Login = lazy(() => import('./pages/Login'));
const ContactMessages = lazy(() => import('./pages/Contact'));
const Brands = lazy(() => import('./pages/Brands'));
const StaticPages = lazy(() => import('./pages/StaticPages'));
const Coupons = lazy(() => import('./pages/Coupons'));
const AllOrders = lazy(() => import('./pages/AllOrders'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceView = lazy(() => import('./pages/InvoiceView'));
const Settings = lazy(() => import('./pages/Settings'));
const HomeSettings = lazy(() => import('./pages/HomeSettings'));
const SocialLinks = lazy(() => import('./pages/SocialLinks'));
const KidsExcel = lazy(() => import('./pages/KidsExcel'));
const NextExcel = lazy(() => import('./pages/NextExcel'));
const Reports = lazy(() => import('./pages/Reports'));
const Rbac = lazy(() => import('./pages/Rbac'));

// Role Constants
const ROLES = {
    SYSTEM_ADMIN: 'SYSTEM_ADMIN',
    ADMIN_KIDS: 'ADMIN_KIDS',
    ADMIN_NEXT: 'ADMIN_NEXT',
};

// Suspense wrapper for lazy components
const LazyPage = ({ children }) => (
    <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
            {children}
        </Suspense>
    </ErrorBoundary>
);

// Protected Route Component
const ProtectedRoute = ({ allowedRoles, children }) => {
    const { user, isAuthenticated, isLoading } = useApp();

    if (isLoading) {
        return <PageLoader />;
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return <LazyPage>{children}</LazyPage>;
};

// Home redirect based on role
const HomeRedirect = () => {
    const { user } = useApp();

    if (user?.role === ROLES.SYSTEM_ADMIN) {
        return <DashboardHome />;
    }
    if (user?.role === ROLES.ADMIN_KIDS) {
        return <Navigate to="/kids/products" replace />;
    }
    if (user?.role === ROLES.ADMIN_NEXT) {
        return <Navigate to="/next/products" replace />;
    }
    return <Navigate to="/login" replace />;
};

const DashboardRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={
                <LazyPage>
                    <Login />
                </LazyPage>
            } />

            <Route element={<DashboardLayout />}>
                {/* Dashboard Home - SYSTEM_ADMIN only */}
                <Route
                    index
                    element={
                        <ProtectedRoute>
                            <HomeRedirect />
                        </ProtectedRoute>
                    }
                />

                {/* Kids Section */}
                <Route path="kids">
                    <Route
                        path="products"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS]}>
                                <KidsProducts />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="products/new"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS]}>
                                <ProductForm audience="KIDS" />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="products/:id/edit"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS]}>
                                <ProductForm audience="KIDS" />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="orders"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS]}>
                                <KidsOrders />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="excel"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS]}>
                                <KidsExcel />
                            </ProtectedRoute>
                        }
                    />
                    <Route index element={<Navigate to="products" replace />} />
                </Route>

                {/* Next Section */}
                <Route path="next">
                    <Route
                        path="products"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_NEXT]}>
                                <NextProducts />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="products/new"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_NEXT]}>
                                <ProductForm audience="NEXT" />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="products/:id/edit"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_NEXT]}>
                                <ProductForm audience="NEXT" />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="orders"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_NEXT]}>
                                <NextOrders />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="excel"
                        element={
                            <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_NEXT]}>
                                <NextExcel />
                            </ProtectedRoute>
                        }
                    />
                    <Route index element={<Navigate to="products" replace />} />
                </Route>

                {/* Users Section - SYSTEM_ADMIN only */}
                <Route
                    path="users"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                            <Users />
                        </ProtectedRoute>
                    }
                />

                {/* System Orders - SYSTEM_ADMIN only */}
                <Route
                    path="orders"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                            <AllOrders />
                        </ProtectedRoute>
                    }
                />

                {/* Invoices - All Admins */}
                <Route
                    path="invoices"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS, ROLES.ADMIN_NEXT]}>
                            <Invoices />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="invoices/:id"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS, ROLES.ADMIN_NEXT]}>
                            <InvoiceView />
                        </ProtectedRoute>
                    }
                />

                {/* Categories Section */}
                <Route
                    path="categories"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS, ROLES.ADMIN_NEXT]}>
                            <Categories />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="categories/new"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS, ROLES.ADMIN_NEXT]}>
                            <CategoryForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="categories/:id/edit"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS, ROLES.ADMIN_NEXT]}>
                            <CategoryForm />
                        </ProtectedRoute>
                    }
                />

                {/* Profile - All roles */}
                <Route
                    path="profile"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS, ROLES.ADMIN_NEXT]}>
                            <Profile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="notifications"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS, ROLES.ADMIN_NEXT]}>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="contact"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                            <ContactMessages />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="brands"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN, ROLES.ADMIN_KIDS]}>
                            <Brands />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="static-pages"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                            <StaticPages />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="coupons"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                            <Coupons />
                        </ProtectedRoute>
                    }
                />

                {/* Settings */}
                <Route
                    path="settings"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                            <Settings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="home-settings"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                            <HomeSettings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="social-links"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                            <SocialLinks />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="reports"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                            <Reports />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="rbac"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                            <Rbac />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default DashboardRoutes;
