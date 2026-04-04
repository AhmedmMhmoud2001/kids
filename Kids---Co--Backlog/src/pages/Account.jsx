import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { updateProfile } from "../api/auth";
import { fetchMyOrders } from "../api/orders";
import { getProductFirstImage } from "../api/products";
import { uploadFile } from "../api/apiClient";

const Account = () => {
  const navigate = useNavigate();
  const { user: currentUser, logout, login } = useApp();
  const fileInputRef = useRef(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Egypt",
    image: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Load user data
  useEffect(() => {
    if (!currentUser) {
      navigate("/signin");
      return;
    }

    setUser({
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      address: currentUser.address || "",
      city: currentUser.city || "",
      country: currentUser.country || "Egypt",
      image: currentUser.image || "",
    });

    if (activeTab === "orders") {
      loadOrders();
    }
  }, [currentUser, navigate, activeTab]);

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await fetchMyOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setImageLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Use apiClient which handles credentials automatically
      const data = await uploadFile('/upload', formData);

      if (data.success) {
        // Update profile with new image
        const updateResponse = await updateProfile({ image: data.data.url });

        if (updateResponse.success) {
          setUser(prev => ({ ...prev, image: data.data.url }));
          login(updateResponse.data);
          setSuccessMessage("Profile picture updated!");
          setTimeout(() => setSuccessMessage(""), 3000);
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      setImageLoading(false);
    }
  };

  // نفس ألوان حالة الطلب في الداشبورد
  const getOrderStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "PAID": return "bg-green-100 text-green-800";
      case "CONFIRMED": return "bg-emerald-100 text-emerald-800";
      case "PROCESSING": return "bg-indigo-100 text-indigo-800";
      case "SHIPPED": return "bg-purple-100 text-purple-800";
      case "DELIVERED": return "bg-blue-100 text-blue-800";
      case "RETURNED": return "bg-orange-100 text-orange-800";
      case "REFUNDED": return "bg-amber-100 text-amber-800";
      case "COMPLETED": return "bg-teal-100 text-teal-800";
      case "CANCELED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Remove profile image
  const handleRemoveImage = async () => {
    if (!user.image) return;

    setImageLoading(true);
    try {
      const response = await updateProfile({ image: '' });
      if (response.success) {
        setUser(prev => ({ ...prev, image: '' }));
        login(response.data);
        setSuccessMessage("Profile picture removed!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      alert('Failed to remove image: ' + error.message);
    } finally {
      setImageLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");

    try {
      const response = await updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
      });

      if (response.success) {
        login(response.data);
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update profile: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) return null;

  const initials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="container mx-auto px-3 sm:px-6 md:px-10 lg:px-20 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 sm:mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-900">
          Home
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">My Account</span>
      </nav>

      <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="text-center mb-5">
              {/* Profile Image */}
              <div className="relative inline-block">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center mx-auto mb-3 border-4 border-white shadow-lg">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-blue-500">
                      {initials}
                    </span>
                  )}
                </div>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-base sm:text-lg truncate">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-600 truncate">{user.email}</p>
            </div>

            {/* Nav buttons */}
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left rounded-lg transition-colors
                  px-3 sm:px-4 py-2 sm:py-3
                  text-sm sm:text-base
                  ${activeTab === "profile"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                  }`}
              >
                Profile Information
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full text-left rounded-lg transition-colors
                  px-3 sm:px-4 py-2 sm:py-3
                  text-sm sm:text-base
                  ${activeTab === "orders"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                  }`}
              >
                My Orders
              </button>

              <Link
                to="/favorites"
                className="block w-full text-left rounded-lg hover:bg-gray-100 transition-colors
                  px-3 sm:px-4 py-2 sm:py-3
                  text-sm sm:text-base"
              >
                Favorites
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left rounded-lg hover:bg-red-50 text-red-600 transition-colors
                  px-3 sm:px-4 py-2 sm:py-3
                  text-sm sm:text-base"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                Profile Information
              </h2>

              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {successMessage}
                </div>
              )}

              {/* Profile Picture Section */}
              <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Profile Picture</h3>
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  {/* Current Image */}
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl sm:text-4xl font-bold text-blue-500">
                          {initials}
                        </span>
                      )}
                    </div>
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Upload/Remove Buttons */}
                  <div className="flex flex-col gap-2 text-center sm:text-left">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageLoading}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {imageLoading ? 'Uploading...' : 'Upload New Photo'}
                    </button>
                    {user.image && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={imageLoading}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                      >
                        Remove Photo
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG or WebP. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Created Date */}
              {currentUser.createdAt && (
                <div className="mb-4 sm:mb-6 text-sm text-gray-600">
                  Member since:{" "}
                  {new Date(currentUser.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5 sm:space-y-6">
                {/* Name Row */}
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={user.firstName}
                      onChange={(e) =>
                        setUser({ ...user, firstName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={user.lastName}
                      onChange={(e) =>
                        setUser({ ...user, lastName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={user.phone}
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={user.address}
                    onChange={(e) =>
                      setUser({ ...user, address: e.target.value })
                    }
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* City & Country */}
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={user.city}
                      onChange={(e) => setUser({ ...user, city: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={user.country}
                      onChange={(e) =>
                        setUser({ ...user, country: e.target.value })
                      }
                      className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full sm:w-auto
                    text-sm sm:text-base
                    py-2.5 sm:py-3
                    px-6 sm:px-8
                    rounded-lg
                    bg-blue-500 hover:bg-blue-600
                    disabled:bg-blue-300 disabled:cursor-not-allowed
                    text-white font-semibold
                    transition-colors
                  "
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                My Orders
              </h2>

              {ordersLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No orders yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start shopping to see your orders here
                  </p>

                  <Link
                    to="/shop"
                    className="
                      inline-flex items-center justify-center
                      w-full sm:w-auto
                      text-sm sm:text-base
                      py-2 sm:py-3
                      px-4 sm:px-8
                      rounded-lg
                      bg-blue-500 hover:bg-blue-600
                      text-white font-medium
                      transition-colors
                    "
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const firstItem = order.items?.[0];
                    const orderImage = firstItem ? getProductFirstImage(firstItem.product) : null;
                    return (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow flex gap-4 sm:gap-5"
                      >
                        {orderImage && (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            <img src={orderImage} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <div>
                              <h3 className="font-semibold text-base sm:text-lg">
                                Order
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <span
                              className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium w-fit ${getOrderStatusColor(order.status)}`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="text-sm text-gray-600">
                              {order.items?.length || 0} items
                            </div>
                            <div className="text-lg font-semibold text-blue-500">
                              {parseFloat(order.totalAmount).toFixed(2)} EGP
                            </div>
                          </div>

                          <Link
                            to={`/account/orders/${order.id}`}
                            className="mt-3 inline-block text-blue-500 hover:text-blue-600 font-medium text-sm"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;
