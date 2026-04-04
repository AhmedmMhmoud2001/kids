# Development Guide

## Project Overview

Kids & Co. is a modern e-commerce website for premium baby and children's clothing. The application is built with React, Vite, and Tailwind CSS, following best practices for component architecture and state management.

## Technology Stack

### Core
- **React 19** - Latest version with improved performance
- **Vite 7** - Lightning-fast build tool and dev server
- **React Router v7** - Client-side routing
- **Tailwind CSS v4** - Utility-first CSS framework

### State Management
- **React Context API** - Global state management for cart and favorites

## Project Structure

```
Kids---Co--Backlog/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   │   ├── Breadcrumb.jsx
│   │   │   ├── Pagination.jsx
│   │   │   └── Loading.jsx
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Layout.jsx
│   │   ├── product/         # Product-related components
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductGrid.jsx
│   │   │   └── ProductQuickView.jsx
│   │   ├── cart/            # Shopping cart components
│   │   │   ├── CartItem.jsx
│   │   │   └── CartSidebar.jsx
│   │   └── filter/          # Filter components
│   │       └── FilterSidebar.jsx
│   ├── pages/               # Page components
│   │   ├── Home.jsx
│   │   ├── Shop.jsx
│   │   ├── Category.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── Cart.jsx
│   │   └── Favorites.jsx
│   ├── context/             # React Context
│   │   └── AppContext.jsx
│   ├── data/                # Mock data
│   │   └── products.js
│   ├── assets/              # Static assets
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Public assets
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── package.json             # Dependencies
```

## Component Guidelines

### Layout Components

**Header.jsx**
- Top banner with promotional message
- Logo and branding
- Navigation icons (search, favorites, user, cart)
- Cart and favorites badges

**Navigation.jsx**
- Main category navigation
- Horizontal menu with links to category pages

**Footer.jsx**
- Company information and logo
- Links to important pages
- Category links
- Social media icons
- Copyright information

### Product Components

**ProductCard.jsx**
- Product image with hover effects
- Favorite toggle button
- Product name, category, and price
- Links to product detail page

**ProductGrid.jsx**
- Responsive grid layout
- Displays multiple ProductCard components
- Adapts to different screen sizes

**ProductQuickView.jsx**
- Modal popup for quick product view
- Image gallery with thumbnails
- Color and size selection
- Quantity selector
- Add to cart functionality

### Cart Components

**CartItem.jsx**
- Product thumbnail and details
- Remove item button
- Quantity controls
- Price display

**CartSidebar.jsx**
- Slide-in sidebar overlay
- List of cart items
- Subtotal calculation
- View cart and checkout buttons

### Filter Components

**FilterSidebar.jsx**
- Sort options (popularity, price, etc.)
- Price range filters
- Color selection
- Brand filters with checkboxes

## State Management

The application uses React Context API for global state management:

### AppContext

**State:**
- `cartItems` - Array of items in shopping cart
- `favorites` - Array of favorite product IDs
- `isCartOpen` - Boolean for cart sidebar visibility

**Actions:**
- `addToCart(product, quantity)` - Add product to cart
- `removeFromCart(productId)` - Remove product from cart
- `updateCartQuantity(productId, quantity)` - Update item quantity
- `clearCart()` - Empty the cart
- `toggleFavorite(productId)` - Add/remove from favorites
- `isFavorite(productId)` - Check if product is favorited

**Computed Values:**
- `cartCount` - Total number of items in cart
- `cartTotal` - Total price of all cart items
- `favoritesCount` - Number of favorite items

## Styling

### Tailwind CSS

The project uses Tailwind CSS for all styling. Key utility classes used:

**Layout:**
- `container mx-auto px-4` - Centered container with padding
- `grid grid-cols-*` - Grid layouts
- `flex items-center justify-between` - Flexbox layouts

**Colors:**
- Blue: `blue-500` for primary actions
- Pink: `pink-500` for branding accents
- Gray: Various shades for text and backgrounds

**Responsive:**
- `md:`, `lg:`, `xl:` - Breakpoint prefixes
- Mobile-first approach

### Custom CSS

Minimal custom CSS in `index.css`:
- Tailwind directives
- Custom component classes (`.btn-primary`, `.btn-secondary`)

## Routing

Routes are defined in `App.jsx`:

```
/ - Home page
/shop - All products
/category/:category - Category-specific products
/product/:id - Product detail page
/cart - Shopping cart
/favorites - Favorites/wishlist
```

## Data Management

Currently using mock data from `src/data/products.js`. This can be replaced with API calls in the future.

**Product Data Structure:**
```javascript
{
  id: number,
  name: string,
  category: string,
  price: string,
  image: string,
  description: string,
  colors: array,
  sizes: array,
  brand: string,
  sku: string,
  isFavorite: boolean
}
```

## Development Workflow

### Starting Development

```bash
npm run dev
```

This starts the Vite dev server with hot module replacement.

### Building for Production

```bash
npm run build
```

Builds optimized production files in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for testing.

### Linting

```bash
npm run lint
```

Runs ESLint to check for code quality issues.

## Best Practices

### Component Design
1. Keep components small and focused
2. Use functional components with hooks
3. Prop drilling should be minimal (use Context for global state)
4. Extract reusable logic into custom hooks

### State Management
1. Use local state for component-specific data
2. Use Context for truly global state (cart, favorites, user)
3. Keep state as close to where it's used as possible

### Styling
1. Use Tailwind utility classes
2. Create custom classes only when necessary
3. Maintain consistent spacing and sizing
4. Follow mobile-first responsive design

### Code Quality
1. Use meaningful variable and function names
2. Add comments for complex logic
3. Keep functions small and single-purpose
4. Follow React best practices and hooks rules

## Future Enhancements

### Short-term
- [ ] Implement search functionality
- [ ] Add product filtering logic
- [ ] Integrate real product images
- [ ] Add loading states
- [ ] Implement error boundaries

### Medium-term
- [ ] User authentication
- [ ] Backend API integration
- [ ] Product reviews and ratings
- [ ] Order history
- [ ] Newsletter subscription

### Long-term
- [ ] Payment gateway integration
- [ ] Admin dashboard
- [ ] Analytics integration
- [ ] Multi-language support
- [ ] Progressive Web App (PWA)

## Troubleshooting

### Common Issues

**Port already in use:**
Vite will automatically try another port. Check terminal output for the actual port.

**Tailwind classes not working:**
Ensure PostCSS and Tailwind are properly configured in `tailwind.config.js` and `postcss.config.js`.

**Import errors:**
Check that all file paths are correct and use the `.jsx` extension for React components.

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Router Documentation](https://reactrouter.com)

## Support

For questions or issues, please refer to the project documentation or contact the development team.

