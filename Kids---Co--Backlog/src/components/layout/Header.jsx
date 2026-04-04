import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import logo from "../../assets/logo.webp";
import logo1 from "../../assets/logo1.webp";
import MobileMenu from "./MobileMenu";
import SearchModal from "../search/SearchModal";
import { NavLink } from "react-router-dom";
import { fetchCategories } from "../../api/categories";
import { fetchTopHeaderOffers } from "../../api/settings";
import { Search, Heart, User, ShoppingBag, Menu } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, cartCount, favoritesCount, setIsCartOpen, audience } = useApp();
  const { language, toggleLanguage, t } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchCategories(audience);
        if (res.success) {
          setCategories(res.data || []);
        }
      } catch (err) {
        console.error("Error fetching header categories:", err);
      }
    };
    loadCategories();
  }, [audience]);

  useEffect(() => {
    const loadOffers = async () => {
      const data = await fetchTopHeaderOffers();
      const active = (data || []).filter(
        (o) => o?.isActive !== false && (o?.titleEn || o?.titleAr || Number(o?.discountPercent || 0) > 0)
      );
      setOffers(active);
    };
    loadOffers();
  }, []);

  const getOfferBannerText = (offer) => {
    if (!offer) return t("header.banner");
    const currentOfferText = language === "ar"
      ? (offer.titleAr || offer.titleEn || "")
      : (offer.titleEn || offer.titleAr || "");
    const offerDiscount = Number(offer.discountPercent || 0);
    const discountText = offerDiscount > 0
      ? (language === "ar" ? `خصم ${offerDiscount}%` : `${offerDiscount}% OFF`)
      : "";
    return discountText
      ? (currentOfferText ? `${currentOfferText} • ${discountText}` : discountText)
      : currentOfferText || t("header.banner");
  };

  const buildOfferLink = (offer) => {
    if (!offer) return null;
    const base = offer.url || "/shop";
    const params = new URLSearchParams();
    if (offer.categorySlug) params.set("categorySlug", String(offer.categorySlug).trim());
    if (offer.brandSlug) params.set("brandSlug", String(offer.brandSlug).trim());
    const ids = Array.isArray(offer.productIds)
      ? offer.productIds
      : String(offer.productIds || "").split(",").map((v) => v.trim()).filter(Boolean);
    if (ids.length) params.set("productIds", ids.join(","));
    if (audience) params.set("audience", audience);
    const q = params.toString();
    if (!q) return base;
    return `${base}${base.includes("?") ? "&" : "?"}${q}`;
  };

  const userMenuRef = useRef(null);

  // Handle click outside for user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Top Banner */}
      <div className="bg-blue-300 text-white py-2 text-sm px-4 sm:px-6 md:px-10 lg:px-16 ">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {offers.length > 0 ? (
              <Swiper
                key={language}
                rtl={language === 'ar'}
                modules={[Autoplay]}
                slidesPerView={1}
                loop={offers.length > 1}
                autoplay={offers.length > 1 ? { delay: 3500, disableOnInteraction: false } : false}
                className="w-full"
              >
                {offers.map((offer) => {
                  const link = buildOfferLink(offer);
                  const text = getOfferBannerText(offer);
                  return (
                    <SwiperSlide key={offer.id || text}>
                      {link ? (
                        <Link to={link} className="block text-center truncate hover:underline underline-offset-2">
                          {text}
                        </Link>
                      ) : (
                        <p className="text-center truncate">{text}</p>
                      )}
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            ) : (
              <p className="text-center truncate">{t("header.banner")}</p>
            )}
          </div>
          <button
            onClick={toggleLanguage}
            className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
            aria-label={language === "en" ? t("common.switchToArabic") : t("common.switchToEnglish")}
          >
            {language === "en" ? t("common.switchToArabic") : t("common.switchToEnglish")}
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="w-full bg-white ">
      <header className="bg-white shadow-sm container mx-auto px-4 sm:px-6 md:px-10 lg:px-16 sticky top-0 z-50 lg:static lg:top-auto lg:z-auto transition-colors duration-300">
        <div className="">
          {/* Top Row */}
          <div className="flex items-center justify-between py-4 ">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-2 rounded-lg transition-colors hover:bg-gray-100"
              aria-label={t("header.openMenu")}
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2 lg:gap-4">

              {/* <NavLink to="/" className="text-xl font-bold  lg:hidden">
                <img src={logo} alt="logo" className="h-8 lg:h-auto" />
              </NavLink> */}


              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `lg:flex items-end justify-center
     h-12 w-24 relative
     transition-colors 
     after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px]
     after:transition-all after:duration-300 after:ease-out
     ${isActive
                    ? "text-gray-900 font-semibold after:w-full after:opacity-100  after:bg-gray-900"
                    : "text-gray-400 hover:text-gray-600 after:w-0 after:opacity-0 opacity-50 hover:after:w-full hover:after:opacity-100 hover:after:bg-gray-600"
                  }`
                }
              >
                <img src={logo1} alt="logo1" className="h-8 w-24 object-contain" />
              </NavLink>

              <NavLink
                to="/home2"
                className={({ isActive }) =>
                  `lg:flex items-end justify-center
     h-12 w-24 relative
     transition-colors text-2xl
     after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px]
     after:transition-all after:duration-300 after:ease-out border-l-2 border-gray-200
     ${isActive
                    ? "text-gray-900 font-semibold after:w-full after:opacity-100 after:bg-gray-900"
                    : "text-gray-400 hover:text-gray-600 after:w-0 after:opacity-0 hover:after:w-full hover:after:opacity-100 hover:after:bg-gray-600"
                  }`
                }
              >
                NEXT
              </NavLink>

            </div>

            {/* Right Icons */}
            <div className="hidden lg:flex items-center gap-1 sm:gap-2">
              {/* Search Icon */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                aria-label={t("header.search")}
              >
                <Search className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
              </button>

              {/* Favorites Icon */}
              <Link
                to="/favorites"
                className="p-2 hover:bg-gray-100 rounded-full relative group transition-colors"
                aria-label={t("header.favorites")}
              >
                <Heart className="w-5 h-5 text-gray-700 group-hover:text-red-500 transition-colors" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </Link>

              {/* User Icon with Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label={t("header.userMenu")}
                >
                  <User className="w-5 h-5 text-gray-700" />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute z-[999] right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 ">
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Link
                          to="/account"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {t("header.myAccount")}
                          </div>
                        </Link>
                        <Link
                          to="/favorites"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            {t("header.myFavorites")}
                          </div>
                        </Link>
                        <hr className="my-2" />
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                            navigate("/");
                          }}
                          className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            {t("header.logout")}
                          </div>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/signin"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                              />
                            </svg>
                            {t("header.signIn")}
                          </div>
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                              />
                            </svg>
                            {t("header.signUp")}
                          </div>
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Icon */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full relative transition-colors group"
                aria-label={t("header.shoppingCart")}
              >
                <ShoppingBag className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      </div>
      
      {/* Logo Center Row - Hidden on mobile, animated on desktop */}
      <div
        className={`hidden lg:block text-center  transition-all duration-300 overflow-hidden sticky top-0 z-40 bg-white shadow-sm  px-4 sm:px-6 md:px-10 lg:px-20 py-5`}
      >
        <Link to="/" className="inline-block">
          <img
            src={logo}
            alt="logo"
            className="transition-transform duration-300"
          />
        </Link>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        categories={categories}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
};

export default Header;
