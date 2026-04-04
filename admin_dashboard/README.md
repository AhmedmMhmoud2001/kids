# Kids & Co - Admin Dashboard 🎯

Admin dashboard for managing Kids & Co e-commerce platform with role-based access control.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 👥 User Roles

### 🔴 SYSTEM_ADMIN
Full access to all features and pages

### 🔵 ADMIN_KIDS
Access to Kids products and orders only

### 🟣 ADMIN_NEXT
Access to Next products and orders only

## 📊 Pages & Access

| Page | SYSTEM_ADMIN | ADMIN_KIDS | ADMIN_NEXT |
|------|--------------|------------|------------|
| Dashboard Home | ✅ | ✅ | ✅ |
| Kids Products | ✅ | ✅ | ❌ |
| Kids Orders | ✅ | ✅ | ❌ |
| Next Products | ✅ | ❌ | ✅ |
| Next Orders | ✅ | ❌ | ✅ |
| Categories | ✅ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ |
| Profile | ✅ | ✅ | ✅ |

## 🔐 Authentication

Login page available at `/login`

Test credentials will be provided by the backend API.

## 📚 Documentation

See [RBAC_DOCUMENTATION.md](./RBAC_DOCUMENTATION.md) for detailed role-based access control documentation.

## 🛠️ Tech Stack

- **React 19** - UI Framework
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Vite** - Build Tool

## 🌐 API Integration

Backend API: `http://localhost:5000/api`

The dashboard is configured to work with the Kids & Co backend API.

## 📁 Project Structure

```
src/
├── pages/          # Page components
├── layout/         # Layout components (Sidebar, Navbar)
├── context/        # React Context (AppContext)
├── api/            # API configuration
├── routes.jsx      # Route definitions
└── App.jsx         # Main app component
```

## 🎨 Features

- ✅ Role-based access control
- ✅ Protected routes
- ✅ Responsive design
- ✅ Modern UI with Tailwind CSS
- ✅ Dynamic sidebar based on user role
- ✅ Profile management
- ✅ Product & order management
- ✅ Category management (SYSTEM_ADMIN)
- ✅ User management (SYSTEM_ADMIN)

## 📝 License

Private - Kids & Co
