# Quick Start Guide - Dashboard CRUD Operations

## 🎯 What's Been Implemented

### ✅ Completed Features

1. **Brands Module** - REMOVED ❌
   - Deleted from dashboard
   - Routes removed
   - API files removed

2. **Categories Module** - FULL CRUD ✅
   - ➕ Create categories with image upload
   - ✏️ Edit categories
   - 🗑️ Delete categories
   - 👁️ View all categories
   - 🔍 Search functionality

3. **Products Module** - FULL CRUD ✅
   - ➕ Create products (Kids & Next)
   - ✏️ Edit products
   - 🗑️ Delete products
   - 👁️ View products in grid/modal
   - 🔍 Search by name, SKU, brand
   - 🖼️ **Multiple image uploads**
   - 🎨 Dynamic colors
   - 📏 Dynamic sizes

## 🚀 How to Use

### Categories Management

1. **Navigate to Categories**
   - Click "Categories" in sidebar (SYSTEM_ADMIN only)

2. **Create New Category**
   - Click "Add Category" button
   - Fill in:
     - Category Name (e.g., "Toys")
     - Slug (auto-generated)
     - Upload Image (drag & drop or click)
     - Set Active status
   - Click "Create Category"

3. **Edit Category**
   - Click edit icon (pencil) on any category
   - Update fields
   - Upload new image if needed
   - Click "Update Category"

4. **Delete Category**
   - Click delete icon (trash) on any category
   - Confirm deletion

### Products Management (Kids/Next)

1. **Navigate to Products**
   - Click "Kids Products" or "Next Products" in sidebar

2. **Create New Product**
   - Click "Add Product" button
   - Fill in basic info:
     - Product Name
     - SKU
     - Price
     - Brand (optional)
     - Category (select from dropdown)
     - Description
   - **Upload Images**:
     - Click upload area or drag & drop
     - Upload multiple images
     - Remove images by clicking X
   - **Add Colors**:
     - Type color name
     - Press Enter or click + button
     - Remove by clicking X on color tag
   - **Add Sizes**:
     - Type size (S, M, L, XL, etc.)
     - Press Enter or click + button
     - Remove by clicking X on size tag
   - Add additional information
   - Set Active status
   - Click "Create Product"

3. **Edit Product**
   - Click "Edit" button on product card
   - Update any fields
   - Add/remove images
   - Add/remove colors/sizes
   - Click "Update Product"

4. **View Product Details**
   - Click "View" button on product card
   - See all product information in modal
   - Close modal by clicking X

5. **Delete Product**
   - Click trash icon on product card
   - Confirm deletion

6. **Search Products**
   - Use search bar at top
   - Search by name, SKU, or brand

## 🔐 Permissions

### SYSTEM_ADMIN
- ✅ Full access to all features
- ✅ Manage categories
- ✅ Manage all products (Kids & Next)
- ✅ Manage users

### ADMIN_KIDS
- ✅ Manage Kids products only
- ✅ View Kids orders
- ❌ Cannot access Next products
- ❌ Cannot manage categories

### ADMIN_NEXT
- ✅ Manage Next products only
- ✅ View Next orders
- ❌ Cannot access Kids products
- ❌ Cannot manage categories

## 📸 Image Upload

### Supported Formats
- PNG
- JPG/JPEG
- GIF

### File Size Limit
- Maximum: 5MB per image

### How It Works
1. Select image file
2. File uploads automatically
3. Preview appears immediately
4. Image URL saved to database
5. Images stored in `backend/uploads/` directory

### Multiple Images (Products Only)
- Upload multiple images per product
- First image used as thumbnail in grid
- All images shown in detail view
- Drag to reorder (future feature)

## 🎨 Product Features

### Colors
- Add unlimited colors
- Type color name and press Enter
- Examples: "Red", "Blue", "Navy Blue", "Forest Green"
- Remove by clicking X on tag

### Sizes
- Add unlimited sizes
- Type size and press Enter
- Examples: "S", "M", "L", "XL", "2XL", "6-12M", "2T", "4T"
- Remove by clicking X on tag

### Categories
- Select from existing categories
- Categories managed separately
- Must create category first before using in products

## 📊 Dashboard Statistics

### Categories Page
- Total Categories
- Active Categories

### Products Page
- Total Products
- Active Products
- Inactive Products
- Total Value (sum of all prices)

## 🔍 Search & Filter

### Categories
- Search by name or slug
- Real-time filtering

### Products
- Search by:
  - Product name
  - SKU
  - Brand name
- Real-time filtering
- Audience-based filtering (automatic based on role)

## ⚠️ Important Notes

1. **Image Upload vs URL**
   - ✅ All images now use upload (not URL input)
   - ✅ Applies to both Categories and Products

2. **Audience Enforcement**
   - ADMIN_KIDS can only create/edit KIDS products
   - ADMIN_NEXT can only create/edit NEXT products
   - Audience field is auto-set based on section

3. **Required Fields**
   - Categories: Name, Slug
   - Products: Name, SKU, Price, Category

4. **Data Format**
   - Colors and Sizes stored as JSON arrays
   - Thumbnails stored as JSON array of URLs
   - Price stored as decimal (2 decimal places)

## 🐛 Troubleshooting

### Image Upload Fails
- Check file size (must be < 5MB)
- Check file format (must be image)
- Check authentication (must be logged in)
- Check token in localStorage (`authToken`)

### 403 Forbidden Error
- Ensure you're logged in
- Check your role permissions
- Verify token is valid

### Product Not Saving
- Fill all required fields
- Select a category
- Ensure price is valid number
- Check console for errors

### Images Not Displaying
- Check backend server is running
- Verify uploads directory exists
- Check file permissions
- Ensure static file serving is enabled

## 📝 Testing Credentials

Use these test accounts (if seeded):

### System Admin
- Email: admin@example.com
- Password: (check your seed file)
- Access: Everything

### Admin Kids
- Email: admin.kids@example.com
- Password: (check your seed file)
- Access: Kids products only

### Admin Next
- Email: admin.next@example.com
- Password: (check your seed file)
- Access: Next products only

## 🎯 Next Steps

1. Test all CRUD operations
2. Upload sample products with images
3. Create categories
4. Test search functionality
5. Verify role-based permissions
6. Check responsive design on mobile

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Check backend terminal for errors
3. Verify all services are running:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - Database: MySQL connection

Happy managing! 🎉
