import { Link, NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

const MobileMenu = ({ isOpen, onClose, categories = [] }) => {
  const location = useLocation();
  const { audience: contextAudience } = useApp();
  const { t } = useLanguage();

  // Read audience from URL query params or use context
  const searchParams = new URLSearchParams(location.search);
  const urlAudience = searchParams.get('audience');
  const audience = urlAudience || contextAudience;

  const mappedCategories = categories.map(cat => ({
    name: cat.name,
    path: `/category/${cat.slug}?audience=${audience}`
  }));

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Mobile Menu */}
      <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 lg:hidden animate-slide-in-left">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold">
              <span className="text-black">Kids</span>
              <span className="text-blue-500">&</span>
              <span className="text-pink-500">Co</span>
              <span className="text-black">.</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {mappedCategories.map((category) => {
                // Check if this category is active by comparing pathnames
                const categoryPathname = category.path.split('?')[0];
                const isActive = location.pathname === categoryPathname;

                return (
                  <NavLink
                    key={category.path}
                    to={category.path}
                    onClick={onClose}
                    className={() =>
                      `block px-4 py-3 rounded-lg font-medium transition-colors ${isActive
                        ? 'bg-blue-50 text-blue-500'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-500'
                      }`
                    }
                  >
                    {t(category.name)}
                  </NavLink>
                );
              })}
            </div>

            <hr className="my-4" />

            {/* Additional Links */}
            <div className="space-y-1">
              <Link
                to={`/shop?audience=${audience}`}
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 rounded-lg font-medium transition-colors"
              >
                {t('mobileMenu.allProducts')}
              </Link>
              <Link
                to="/favorites"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 rounded-lg font-medium transition-colors"
              >
                {t('mobileMenu.favorites')}
              </Link>
              <Link
                to="/account"
                onClick={onClose}
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 rounded-lg font-medium transition-colors"
              >
                {t('mobileMenu.myAccount')}
              </Link>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex gap-4 justify-center">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-500 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-pink-500 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;

