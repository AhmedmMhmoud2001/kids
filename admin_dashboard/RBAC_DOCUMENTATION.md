# Admin Dashboard - Role-Based Access Control (RBAC)

## 📋 Access Control Matrix

| الصفحة / Page | SYSTEM_ADMIN | ADMIN_KIDS | ADMIN_NEXT |
|--------------|--------------|------------|------------|
| **Dashboard Home** | ✅ | ✅ | ✅ |
| **Kids Products** | ✅ | ✅ | ❌ |
| **Kids Orders** | ✅ | ✅ | ❌ |
| **Next Products** | ✅ | ❌ | ✅ |
| **Next Orders** | ✅ | ❌ | ✅ |
| **Categories** | ✅ | ❌ | ❌ |
| **Users** | ✅ | ❌ | ❌ |
| **Profile** | ✅ | ✅ | ✅ |

## 🎯 Role Descriptions

### SYSTEM_ADMIN (مدير النظام)
- **Full Access**: Has access to ALL pages and features
- **Permissions**:
  - View and manage all products (Kids & Next)
  - View and manage all orders (Kids & Next)
  - Manage categories
  - Manage users and assign roles
  - Access dashboard analytics
  - Edit profile settings

### ADMIN_KIDS (مدير قسم الأطفال)
- **Kids Section Access**: Limited to Kids products and orders
- **Permissions**:
  - View and manage Kids products only
  - View and manage Kids orders only
  - Access dashboard home
  - Edit profile settings
- **Restrictions**:
  - ❌ Cannot access Next products/orders
  - ❌ Cannot manage categories
  - ❌ Cannot manage users

### ADMIN_NEXT (مدير قسم المراهقين)
- **Next Section Access**: Limited to Next products and orders
- **Permissions**:
  - View and manage Next products only
  - View and manage Next orders only
  - Access dashboard home
  - Edit profile settings
- **Restrictions**:
  - ❌ Cannot access Kids products/orders
  - ❌ Cannot manage categories
  - ❌ Cannot manage users

## 📁 Project Structure

```
admin_dashboard/
├── src/
│   ├── pages/
│   │   ├── DashboardHome.jsx    # ✅ All Roles
│   │   ├── KidsProducts.jsx     # ✅ SYSTEM_ADMIN, ADMIN_KIDS
│   │   ├── KidsOrders.jsx       # ✅ SYSTEM_ADMIN, ADMIN_KIDS
│   │   ├── NextProducts.jsx     # ✅ SYSTEM_ADMIN, ADMIN_NEXT
│   │   ├── NextOrders.jsx       # ✅ SYSTEM_ADMIN, ADMIN_NEXT
│   │   ├── Categories.jsx       # ✅ SYSTEM_ADMIN only
│   │   ├── Users.jsx            # ✅ SYSTEM_ADMIN only
│   │   ├── Profile.jsx          # ✅ All Roles
│   │   └── Login.jsx            # 🔓 Public
│   ├── layout/
│   │   ├── DashboardLayout.jsx  # Main layout with sidebar
│   │   ├── Sidebar.jsx          # Role-based menu filtering
│   │   └── Navbar.jsx           # Top navigation bar
│   ├── context/
│   │   └── AppContext.jsx       # Authentication context
│   ├── routes.jsx               # Protected routes configuration
│   └── App.jsx                  # Main app component
```

## 🔐 Authentication Flow

1. **Login**: User enters credentials at `/login`
2. **Token Storage**: JWT token stored in localStorage
3. **Role Detection**: User role extracted from token/user data
4. **Route Protection**: `ProtectedRoute` component checks user role
5. **Sidebar Filtering**: Menu items filtered based on user role
6. **Access Control**: Unauthorized access redirects to home

## 🚀 Routes Configuration

### Public Routes
- `/login` - Login page (no authentication required)

### Protected Routes (require authentication)
- `/` - Dashboard Home (All roles)
- `/kids/products` - Kids Products (SYSTEM_ADMIN, ADMIN_KIDS)
- `/kids/orders` - Kids Orders (SYSTEM_ADMIN, ADMIN_KIDS)
- `/next/products` - Next Products (SYSTEM_ADMIN, ADMIN_NEXT)
- `/next/orders` - Next Orders (SYSTEM_ADMIN, ADMIN_NEXT)
- `/categories` - Categories Management (SYSTEM_ADMIN only)
- `/users` - User Management (SYSTEM_ADMIN only)
- `/profile` - Profile Settings (All roles)

## 🎨 Features

### Dashboard Home
- Overview statistics
- Recent activity
- Quick actions
- Role-specific widgets

### Products Pages
- Product listing with search and filters
- Add/Edit/Delete products
- Image upload
- Category assignment
- Audience filtering (Kids/Next)

### Orders Pages
- Order listing with status filters
- Order details view
- Status updates
- Customer information
- Audience-based filtering

### Categories Page (SYSTEM_ADMIN only)
- Category management
- Audience assignment
- Product count tracking

### Users Page (SYSTEM_ADMIN only)
- User listing
- Role assignment
- User activation/deactivation
- Create new admin users

### Profile Page
- Personal information editing
- Password change
- Account settings
- Role display

## 🔧 Technical Implementation

### ProtectedRoute Component
```javascript
const ProtectedRoute = ({ allowedRoles, children }) => {
    const { user, isAuthenticated } = useApp();
    
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }
    
    return children;
};
```

### Sidebar Menu Filtering
```javascript
const filteredItems = menuItems.filter(item =>
    item.roles.includes(role)
);
```

## 📝 Usage Example

### Testing Different Roles

**SYSTEM_ADMIN Login:**
- Email: `admin@example.com`
- Access: All 8 pages

**ADMIN_KIDS Login:**
- Email: `kids@example.com`
- Access: Dashboard Home, Kids Products, Kids Orders, Profile (4 pages)

**ADMIN_NEXT Login:**
- Email: `next@example.com`
- Access: Dashboard Home, Next Products, Next Orders, Profile (4 pages)

## 🌐 API Integration

The dashboard is ready to connect to the backend API at:
- **Backend URL**: `http://localhost:5000/api`
- **Auth Endpoint**: `/auth/login`
- **Products Endpoint**: `/products`
- **Orders Endpoint**: `/orders`
- **Users Endpoint**: `/users`
- **Categories Endpoint**: `/categories`

## 📦 Dependencies

- **React** - UI framework
- **React Router DOM** - Routing
- **Lucide React** - Icons
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## 🎯 Next Steps

1. ✅ Connect to backend API
2. ✅ Implement real authentication
3. ✅ Add data fetching from API
4. ✅ Implement CRUD operations
5. ✅ Add form validation
6. ✅ Implement file upload for products
7. ✅ Add pagination and sorting
8. ✅ Implement real-time updates
