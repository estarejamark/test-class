# Loading Components Documentation

## Overview

Reusable loading components that provide consistent loading states throughout the application. All components are located in `src/components/utils/loading.tsx`.

## Available Components

### 1. LoadingSpinner

Basic spinner component that can be customized for size and color.

```tsx
import { LoadingSpinner } from "@/components/utils";

<LoadingSpinner size="lg" color="blue" />;
```

**Props:**

- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `color`: 'primary' | 'white' | 'gray' | 'blue' (default: 'gray')
- `className`: Additional CSS classes

### 2. LoadingComponent

Flexible loading component with text and layout options.

```tsx
import { LoadingComponent } from "@/components/utils";

<LoadingComponent
  size="lg"
  color="blue"
  text="Loading data..."
  layout="horizontal"
  container="card"
/>;
```

**Props:**

- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `color`: 'primary' | 'white' | 'gray' | 'blue' (default: 'gray')
- `text`: Loading message (default: 'Loading...')
- `layout`: 'horizontal' | 'vertical' (default: 'horizontal')
- `container`: 'page' | 'card' | 'inline' | 'fullscreen' (default: 'card')

### 3. Page Skeleton Components with Text

These components provide skeleton loading states with descriptive text for each navigation page:

#### ManageUsersPageSkeleton

```tsx
import { ManageUsersPageSkeleton } from "@/components/utils";

<ManageUsersPageSkeleton />;
```

Shows "Loading Users..." with skeleton for user tables and controls.

#### ManageSectionsPageSkeleton

```tsx
import { ManageSectionsPageSkeleton } from "@/components/utils";

<ManageSectionsPageSkeleton />;
```

Shows "Loading Sections..." with skeleton for section cards and management.

#### ManageSubjectsPageSkeleton

```tsx
import { ManageSubjectsPageSkeleton } from "@/components/utils";

<ManageSubjectsPageSkeleton />;
```

Shows "Loading Subjects..." with skeleton for subject categories and lists.

#### TeacherLoadsPageSkeleton

```tsx
import { TeacherLoadsPageSkeleton } from "@/components/utils";

<TeacherLoadsPageSkeleton />;
```

Shows "Loading Teacher Loads..." with skeleton for workload tables and stats.

#### GradeMonitoringPageSkeleton

```tsx
import { GradeMonitoringPageSkeleton } from "@/components/utils";

<GradeMonitoringPageSkeleton />;
```

Shows "Loading Grade Monitoring..." with skeleton for charts and grade tables.

#### AttendanceOverviewPageSkeleton

```tsx
import { AttendanceOverviewPageSkeleton } from "@/components/utils";

<AttendanceOverviewPageSkeleton />;
```

Shows "Loading Attendance Overview..." with skeleton for calendar and stats.

#### ReportsPageSkeleton

```tsx
import { ReportsPageSkeleton } from "@/components/utils";

<ReportsPageSkeleton />;
```

Shows "Loading Reports..." with skeleton for report cards and tables.

#### SettingsPageSkeleton

```tsx
import { SettingsPageSkeleton } from "@/components/utils";

<SettingsPageSkeleton />;
```

Shows "Loading Settings..." with skeleton for configuration sections.

### 4. Specialized Loading Components

#### ButtonLoading

For loading states inside buttons.

```tsx
import { ButtonLoading } from "@/components/utils";

{
  isLoading ? <ButtonLoading text="Saving..." /> : "Save";
}
```

#### DashboardLoading

For dashboard pages with consistent layout.

```tsx
import { DashboardLoading } from "@/components/utils";

if (isLoading) {
  return <DashboardLoading text="Loading dashboard data..." />;
}
```

#### PageLoading

For full-page loading states.

```tsx
import { PageLoading } from "@/components/utils";

if (isLoading) {
  return <PageLoading text="Loading..." />;
}
```

#### RedirectLoading

For redirect scenarios.

```tsx
import { RedirectLoading } from "@/components/utils";

return <RedirectLoading text="Redirecting to dashboard..." />;
```

#### TableLoading

For data tables and lists.

```tsx
import { TableLoading } from "@/components/utils";

if (loading) {
  return <TableLoading text="Loading users..." />;
}
```

#### InlineLoading

For smaller inline loading states.

```tsx
import { InlineLoading } from "@/components/utils";

<InlineLoading text="Processing..." />;
```

#### FullscreenLoading

For overlay loading states.

```tsx
import { FullscreenLoading } from "@/components/utils";

{
  isProcessing && <FullscreenLoading text="Processing request..." />;
}
```

## Migration Examples

### Before (Old Way)

```tsx
// Custom loading spinner every time
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      <span className="ml-4 text-gray-600">Loading users...</span>
    </div>
  );
}
```

### After (Using Utility)

```tsx
import { TableLoading } from "@/components/utils";

if (loading) {
  return <TableLoading text="Loading users..." />;
}
```

## Benefits

1. **Consistency**: All loading states look and behave the same across the app
2. **Maintainability**: Changes to loading styles only need to be made in one place
3. **Reusability**: No need to rewrite loading components for each page
4. **Type Safety**: Full TypeScript support with proper prop types
5. **Accessibility**: Built-in accessibility considerations
6. **Performance**: Optimized components with proper React patterns

## Usage Guidelines

1. **Choose the right component**: Use the specialized components (DashboardLoading, TableLoading) when available
2. **Consistent messaging**: Use descriptive loading text that matches the action
3. **Proper sizing**: Match the spinner size to the content area
4. **Color consistency**: Use blue for primary actions, gray for secondary

## Files Updated

The following components have been migrated to use the new loading utilities:

- ✅ `DashboardHomeComponent.tsx` - Uses `DashboardLoading`
- ✅ `ManageUsersComponent.tsx` - Uses `TableLoading`
- ✅ `ManageSubjectsComponent.tsx` - Uses `TableLoading`
- ✅ `ManageSectionsComponent.tsx` - Uses `TableLoading`
- ✅ `login-form.tsx` - Uses `RedirectLoading` and `ButtonLoading`
- ✅ `protected-route.tsx` - Uses `PageLoading`
- ✅ `auth.context.tsx` - Uses `PageLoading`
- ✅ `app-sidebar.tsx` - Uses `SidebarSkeleton`
- ✅ `section-cards.tsx` - Uses `CardSkeleton`

## 4. Skeleton Components

### SidebarSkeleton

Skeleton loader for the app sidebar.

```tsx
import { SidebarSkeleton } from "@/components/utils";

// In AppSidebar component
if (isLoading) {
  return (
    <Sidebar>
      <SidebarSkeleton />
    </Sidebar>
  );
}
```

### CardSkeleton

Skeleton loader for dashboard cards.

```tsx
import { CardSkeleton } from "@/components/utils";

// Loading state for dashboard cards
if (isLoading) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### TableSkeleton

Skeleton loader for data tables.

```tsx
import { TableSkeleton } from "@/components/utils";

if (isLoading) {
  return <TableSkeleton rows={5} columns={4} showHeader={true} />;
}
```

**Props:**

- `rows`: Number of skeleton rows (default: 5)
- `columns`: Number of skeleton columns (default: 4)
- `showHeader`: Show skeleton header row (default: true)

### ChartSkeleton

Skeleton loader for charts and graphs.

```tsx
import { ChartSkeleton } from "@/components/utils";

if (isLoading) {
  return <ChartSkeleton height="h-[400px]" />;
}
```

**Props:**

- `height`: Height class for the skeleton (default: "h-[300px]")

## Import Path

```tsx
import {
  LoadingSpinner,
  LoadingComponent,
  ButtonLoading,
  DashboardLoading,
  PageLoading,
  RedirectLoading,
  TableLoading,
  InlineLoading,
  FullscreenLoading,
  SidebarSkeleton,
  CardSkeleton,
  TableSkeleton,
  TableRowSkeleton,
  ChartSkeleton,
  // Page-specific skeletons
  ManageUsersPageSkeleton,
  ManageSectionsPageSkeleton,
  ManageSubjectsPageSkeleton,
  TeacherLoadsPageSkeleton,
  GradeMonitoringPageSkeleton,
  AttendanceOverviewPageSkeleton,
  ReportsPageSkeleton,
  SettingsPageSkeleton,
} from "@/components/utils";
```

## Complete Navigation Implementation Example

Here's how to implement skeleton loading with text for each navigation page:

```tsx
"use client";

import { useState } from "react";
import { AppSidebar, NavigationItem } from "@/components/dashboard/app-sidebar";
import {
  ManageUsersPageSkeleton,
  ManageSectionsPageSkeleton,
  ManageSubjectsPageSkeleton,
  TeacherLoadsPageSkeleton,
  GradeMonitoringPageSkeleton,
  AttendanceOverviewPageSkeleton,
  ReportsPageSkeleton,
  SettingsPageSkeleton,
} from "@/components/utils";

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<NavigationItem>("dashboard");
  const [pageLoading, setPageLoading] = useState(false);

  const handleNavigation = (item: NavigationItem) => {
    // Show page loading when navigating to new pages
    if (item !== activeView && item !== "dashboard") {
      setPageLoading(true);

      // Simulate API call or data loading
      setTimeout(() => {
        setActiveView(item);
        setPageLoading(false);
      }, 1500); // Show skeleton with text for 1.5 seconds
    } else {
      setActiveView(item);
    }
  };

  const renderContent = () => {
    // Show page-specific skeletons with descriptive text while loading
    if (pageLoading) {
      switch (activeView) {
        case "manage-users-reusable":
          return <ManageUsersPageSkeleton />;
        case "manage-sections":
          return <ManageSectionsPageSkeleton />;
        case "manage-subjects":
          return <ManageSubjectsPageSkeleton />;
        case "teacher-loads":
          return <TeacherLoadsPageSkeleton />;
        case "grade-monitoring":
          return <GradeMonitoringPageSkeleton />;
        case "attendance-overview":
          return <AttendanceOverviewPageSkeleton />;
        case "reports":
          return <ReportsPageSkeleton />;
        case "settings":
          return <SettingsPageSkeleton />;
        default:
          return null;
      }
    }

    // Render actual content
    switch (activeView) {
      case "dashboard":
        return <DashboardHomeComponent />;
      case "manage-users-reusable":
        return <ManageUsersComponent />;
      // ... other cases
      default:
        return <DashboardHomeComponent />;
    }
  };

  return (
    <div>
      <AppSidebar onNavigate={handleNavigation} activeItem={activeView} />
      <main>{renderContent()}</main>
    </div>
  );
}
```

## Key Features

1. **Descriptive Text**: Each skeleton shows what is loading (e.g., "Loading Users...")
2. **Realistic Skeletons**: Match the actual page structure with appropriate placeholders
3. **Consistent UX**: All navigation pages now have skeleton loading instead of spinners
4. **Better Perceived Performance**: Users understand what content is coming
5. **Reusable Components**: Each skeleton can be used independently

## Benefits

- **User Experience**: Clear indication of what content is loading
- **Consistency**: Standardized loading patterns across all pages
- **Performance**: Better perceived performance with skeleton loading
- **Maintainability**: Centralized loading components, easy to update
- **Accessibility**: Proper loading states for screen readers
