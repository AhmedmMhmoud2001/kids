# Category Audience System - Implementation Summary

## Overview
Successfully implemented audience-based category system where categories can have the same name but different images for KIDS and NEXT audiences.

## Database Changes

### Prisma Schema Updates
```prisma
model Category {
  id        Int       @id @default(autoincrement())
  name      String
  slug      String
  image     String?
  audience  Audience  // NEW: KIDS or NEXT
  isActive  Boolean   @default(true)
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@unique([name, audience])  // NEW: Unique constraint
  @@unique([slug, audience])  // NEW: Unique constraint
  @@map("categories")
}
```

### Key Changes:
- ✅ Added `audience` field (enum: KIDS | NEXT)
- ✅ Removed unique constraint from `name` alone
- ✅ Removed unique constraint from `slug` alone
- ✅ Added composite unique constraint on `[name, audience]`
- ✅ Added composite unique constraint on `[slug, audience]`

### Migration
- ✅ Database migrated successfully
- ✅ Migration name: `add_audience_to_categories`

## Backend Changes

### Service Layer (`categories.service.js`)
```javascript
// Updated findAll to support audience filtering
exports.findAll = async (audience = null) => {
    const where = audience ? { audience } : {};
    return prisma.category.findMany({
        where,
        include: { _count: { select: { products: true } } },
        orderBy: { createdAt: 'desc' }
    });
};
```

### Controller Layer (`categories.controller.js`)
```javascript
// Updated to pass audience query parameter
exports.findAll = async (req, res) => {
    try {
        const { audience } = req.query;
        const categories = await categoryService.findAll(audience);
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
```

### API Endpoints
- `GET /api/categories` - Get all categories
- `GET /api/categories?audience=KIDS` - Get KIDS categories only
- `GET /api/categories?audience=NEXT` - Get NEXT categories only
- `POST /api/categories` - Create category (SYSTEM_ADMIN only)
- `PUT /api/categories/:id` - Update category (SYSTEM_ADMIN only)
- `DELETE /api/categories/:id` - Delete category (SYSTEM_ADMIN only)

## Frontend Changes

### API Helper (`src/api/categories.js`)
```javascript
export const fetchCategories = async (audience = null) => {
    const url = audience 
        ? `${API_BASE_URL}/categories?audience=${audience}` 
        : `${API_BASE_URL}/categories`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    // ...
};
```

### Category Form (`CategoryForm.jsx`)
- ✅ Added `audience` field to form state
- ✅ Added Audience dropdown (KIDS/NEXT)
- ✅ Audience field is **disabled in edit mode** (cannot be changed after creation)
- ✅ Default audience: KIDS
- ✅ Loads audience when editing existing category

### Categories List (`Categories.jsx`)
- ✅ Added audience filter dropdown
- ✅ Added Audience column to table
- ✅ Color-coded audience badges:
  - KIDS: Blue badge
  - NEXT: Purple badge
- ✅ Real-time filtering by audience
- ✅ Search works across all fields

## Features

### 1. Audience-Based Categories
- Same category name can exist for both KIDS and NEXT
- Each has its own unique image
- Example:
  - "Boy" + KIDS → kids-boy.png
  - "Boy" + NEXT → next-boy.png

### 2. Filtering
- Filter by audience in dashboard
- "All Audiences" shows everything
- "Kids" shows only KIDS categories
- "Next" shows only NEXT categories

### 3. Permissions (RBAC)
- **SYSTEM_ADMIN**: Full CRUD access
- **ADMIN_KIDS**: Read-only (cannot manage categories)
- **ADMIN_NEXT**: Read-only (cannot manage categories)
- **CUSTOMER**: Read-only (public access)

### 4. Validation
- Unique constraint enforced: `name + audience` must be unique
- Cannot have duplicate "Boy" + "KIDS"
- CAN have "Boy" + "KIDS" AND "Boy" + "NEXT"

## User Experience

### Creating a Category
1. Navigate to Categories
2. Click "Add Category"
3. Fill in:
   - Category Name (e.g., "Boy")
   - Slug (auto-generated, e.g., "boy")
   - **Select Audience** (KIDS or NEXT)
   - Upload Image
   - Set Active status
4. Click "Create Category"

### Editing a Category
1. Click Edit icon on category
2. Can update:
   - Name
   - Slug
   - Image
   - Active status
3. **Cannot change Audience** (disabled field)
4. Click "Update Category"

### Filtering Categories
1. Use audience dropdown: "All Audiences", "Kids", or "Next"
2. Categories reload automatically
3. Search works within filtered results

## Technical Details

### Data Structure
```javascript
{
  id: 1,
  name: "Boy",
  slug: "boy",
  image: "http://localhost:5000/uploads/1234567890.jpg",
  audience: "KIDS",
  isActive: true,
  createdAt: "2026-01-21T10:00:00.000Z",
  updatedAt: "2026-01-21T10:00:00.000Z",
  _count: {
    products: 5
  }
}
```

### Unique Constraints
Database enforces uniqueness at the schema level:
- `@@unique([name, audience])`
- `@@unique([slug, audience])`

If you try to create duplicate "Boy" + "KIDS", database will reject it.

## Testing Checklist

### Backend
- [ ] Create KIDS category "Boy"
- [ ] Create NEXT category "Boy" (should succeed)
- [ ] Try to create duplicate KIDS "Boy" (should fail)
- [ ] GET /categories (returns all)
- [ ] GET /categories?audience=KIDS (returns only KIDS)
- [ ] GET /categories?audience=NEXT (returns only NEXT)
- [ ] Update category (audience should not change)
- [ ] Delete category

### Frontend
- [ ] Create category with KIDS audience
- [ ] Create category with NEXT audience
- [ ] Filter by "Kids" - see only KIDS categories
- [ ] Filter by "Next" - see only NEXT categories
- [ ] Filter by "All Audiences" - see everything
- [ ] Edit category - audience field is disabled
- [ ] Search works with filters
- [ ] Audience badge shows correct color

## Example Use Cases

### Use Case 1: Same Category, Different Images
```
Category: "Boy"
- KIDS audience: kids-boy-toys.jpg (shows toys)
- NEXT audience: next-boy-clothes.jpg (shows teen clothes)
```

### Use Case 2: Audience-Specific Categories
```
Category: "Accessories"
- KIDS audience: kids-accessories.jpg (backpacks, lunch boxes)
- NEXT audience: next-accessories.jpg (watches, belts)
```

### Use Case 3: Shared Names, Different Products
```
Category: "Girl"
- KIDS audience: 
  - Image: kids-girl.jpg
  - Products: Dolls, Dress-up, Toys
- NEXT audience:
  - Image: next-girl.jpg
  - Products: Teen fashion, Accessories
```

## Benefits

1. **Flexibility**: Same category names for different audiences
2. **Organization**: Clear separation between KIDS and NEXT
3. **Scalability**: Easy to add more audiences in future
4. **Data Integrity**: Database-level uniqueness enforcement
5. **User-Friendly**: Simple filtering and management

## Notes

- Audience field is **required** for all new categories
- Audience **cannot be changed** after creation (prevents data inconsistency)
- Products are linked to categories, so changing audience would break relationships
- If you need to change audience, delete and recreate the category

## Future Enhancements

- [ ] Bulk import categories with audience
- [ ] Category templates by audience
- [ ] Audience-based category suggestions
- [ ] Analytics per audience
- [ ] Category hierarchy (parent/child) with audience inheritance
