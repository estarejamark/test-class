# DataManagementTable - Reusable Component

The `DataManagementTable` is a highly flexible and reusable component for managing different types of data with full CRUD operations, search, filtering, and modal forms.

## Features

- ✅ **Generic Data Management** - Works with any data type that extends `BaseItem`
- ✅ **Dynamic Table Columns** - Configure which columns to display and how
- ✅ **Dynamic Form Fields** - Configure form fields with different input types
- ✅ **Search Functionality** - Search across multiple columns
- ✅ **Multiple Filters** - Add dropdown filters for different data fields
- ✅ **CRUD Operations** - Add, Edit, Delete with customizable handlers
- ✅ **Status Management** - Toggle active/inactive status
- ✅ **Modal Forms** - Responsive modal forms with validation
- ✅ **Conditional Fields** - Show/hide fields based on other field values
- ✅ **Custom Badges** - Customizable badge colors for different values
- ✅ **Responsive Design** - Works on mobile and desktop
- ✅ **Accessibility** - Screen reader friendly with proper ARIA labels

## Basic Usage

```tsx
import {
  DataManagementTable,
  TableColumn,
  FormField,
  BaseItem,
} from "@/components/dashboard/DataManagementTable";

interface MyItem extends BaseItem {
  name: string;
  email: string;
  role: string;
}

const columns: TableColumn[] = [
  { key: "name", label: "Name", searchable: true },
  { key: "email", label: "Email", searchable: true },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
];

const formFields: FormField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "role", label: "Role", type: "select", options: ["Admin", "User"] },
];

function MyComponent() {
  return (
    <DataManagementTable
      title="My Items"
      description="Manage your items"
      data={myData}
      columns={columns}
      formFields={formFields}
    />
  );
}
```

## Configuration Options

### TableColumn Interface

```tsx
interface TableColumn {
  key: string; // The data property key
  label: string; // Column header text
  render?: (value: any, item: BaseItem) => React.ReactNode; // Custom render function
  searchable?: boolean; // Include in search (default: true)
}
```

### FormField Interface

```tsx
interface FormField {
  key: string; // The data property key
  label: string; // Field label
  type: "text" | "email" | "select" | "number"; // Input type
  required?: boolean; // Is field required
  placeholder?: string; // Input placeholder
  options?: string[] | { value: string; label: string }[]; // Select options
  dependsOn?: string; // Show only when another field has specific value
  dependsOnValue?: string | string[]; // The value(s) to depend on
  gridColumn?: 1 | 2; // 1 for full width, 2 for half width
}
```

### Props Interface

```tsx
interface DataManagementTableProps {
  title: string; // Page title
  description: string; // Page description
  data: BaseItem[]; // Array of data items
  columns: TableColumn[]; // Table column configuration
  formFields: FormField[]; // Form field configuration
  filterOptions?: FilterOption[]; // Filter dropdown options
  onAdd?: (item: Omit<BaseItem, "id">) => void; // Add handler
  onEdit?: (id: number, item: Partial<BaseItem>) => void; // Edit handler
  onDelete?: (id: number) => void; // Delete handler
  onStatusToggle?: (id: number) => void; // Status toggle handler
  searchPlaceholder?: string; // Search input placeholder
  addButtonText?: string; // Add button text
  editModalTitle?: string; // Edit modal title
  addModalTitle?: string; // Add modal title
  editModalDescription?: string; // Edit modal description
  addModalDescription?: string; // Add modal description
  getBadgeColor?: (key: string, value: any) => string; // Badge color function
  actions?: {
    // Enable/disable actions
    edit?: boolean;
    statusToggle?: boolean;
    delete?: boolean;
  };
}
```

## Examples

### 1. User Management (Included)

See `ManageUsersComponentReusable.tsx` for a complete example with:

- Conditional fields (Student ID only for Students)
- Multiple filters (by role)
- Custom badge colors
- Grid layout for form fields

### 2. Course Management (Included)

See `ManageCoursesComponent.tsx` for another example with:

- Multiple filters (by department and semester)
- Different data structure
- Custom badge colors for departments

### 3. Simple Inventory Example

```tsx
interface Product extends BaseItem {
  name: string;
  price: number;
  category: string;
  stock: number;
}

const productColumns: TableColumn[] = [
  { key: "name", label: "Product Name", searchable: true },
  { key: "price", label: "Price", render: (value) => `$${value}` },
  { key: "category", label: "Category" },
  { key: "stock", label: "Stock" },
];

const productFormFields: FormField[] = [
  { key: "name", label: "Product Name", type: "text", required: true },
  { key: "price", label: "Price", type: "number", required: true },
  {
    key: "category",
    label: "Category",
    type: "select",
    options: ["Electronics", "Clothing", "Books"],
  },
  { key: "stock", label: "Stock Quantity", type: "number", required: true },
];
```

## Advanced Features

### Conditional Fields

Show fields only when other fields have specific values:

```tsx
{
  key: "studentId",
  label: "Student ID",
  type: "text",
  dependsOn: "role",           // Show only when 'role' field
  dependsOnValue: "Student"    // has value "Student"
}
```

### Custom Column Rendering

```tsx
{
  key: "price",
  label: "Price",
  render: (value, item) => (
    <span className="font-bold text-green-600">
      ${value.toFixed(2)}
    </span>
  )
}
```

### Custom Badge Colors

```tsx
const getBadgeColor = (key: string, value: any) => {
  if (key === "status") {
    return value === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  }
  return "bg-gray-100 text-gray-800";
};
```

### Grid Layout for Forms

Use `gridColumn: 2` to put fields side by side:

```tsx
{ key: "firstName", label: "First Name", type: "text", gridColumn: 2 },
{ key: "lastName", label: "Last Name", type: "text", gridColumn: 2 },
```

## Migration from Original Component

If you have an existing component similar to the original `ManageUsersComponent`, here's how to migrate:

1. **Define your data interface** extending `BaseItem`
2. **Configure columns** using the `TableColumn` interface
3. **Configure form fields** using the `FormField` interface
4. **Set up handlers** for CRUD operations
5. **Replace your component** with `DataManagementTable`

The migration should be straightforward as the API is designed to be intuitive and cover most common use cases.

## TypeScript Support

The component is fully typed with TypeScript, providing excellent IntelliSense and type safety. All interfaces are exported for use in your components.

## Styling

The component uses Tailwind CSS and follows the same design patterns as your existing UI components. All styling is consistent with your current design system.
