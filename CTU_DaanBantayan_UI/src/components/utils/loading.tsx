import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "white" | "gray" | "blue";
  className?: string;
}

export interface LoadingComponentProps extends LoadingSpinnerProps {
  text?: string;
  layout?: "horizontal" | "vertical";
  container?: "page" | "card" | "inline" | "fullscreen";
  className?: string;
}

/**
 * Reusable loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "gray",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-32 w-32",
  };

  const colorClasses = {
    primary: "border-primary",
    white: "border-white",
    gray: "border-gray-900",
    blue: "border-blue-600",
  };

  return (
    <div
      className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
};

/**
 * Full loading component with text and container layouts
 */
export const LoadingComponent: React.FC<LoadingComponentProps> = ({
  size = "md",
  color = "gray",
  text = "Loading...",
  layout = "horizontal",
  container = "card",
  className = "",
}) => {
  const containerClasses = {
    page: "flex items-center justify-center min-h-screen bg-gray-50",
    card: "flex items-center justify-center min-h-[400px]",
    inline: "flex items-center justify-center py-8",
    fullscreen:
      "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50",
  };

  const layoutClasses = {
    horizontal: "flex items-center",
    vertical: "flex flex-col items-center",
  };

  const textSpacing = layout === "horizontal" ? "ml-2" : "mt-4";

  return (
    <div className={`${containerClasses[container]} ${className}`}>
      <div className={`${layoutClasses[layout]}`}>
        <LoadingSpinner size={size} color={color} />
        {text && <span className={`text-gray-600 ${textSpacing}`}>{text}</span>}
      </div>
    </div>
  );
};

/**
 * Button loading state component
 */
export const ButtonLoading: React.FC<{ text?: string }> = ({
  text = "Loading...",
}) => (
  <div className="flex items-center">
    <LoadingSpinner size="sm" color="white" className="mr-2" />
    {text}
  </div>
);

/**
 * Dashboard loading component
 */
export const DashboardLoading: React.FC<{ text?: string }> = ({
  text = "Loading dashboard data...",
}) => (
  <div className="@container/main flex flex-1 flex-col gap-2">
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <LoadingComponent
        size="lg"
        color="gray"
        text={text}
        container="card"
        layout="horizontal"
      />
    </div>
  </div>
);

/**
 * Page loading component (for full pages)
 */
export const PageLoading: React.FC<{ text?: string }> = ({
  text = "Loading...",
}) => (
  <LoadingComponent
    size="lg"
    color="blue"
    text={text}
    container="page"
    layout="vertical"
  />
);

/**
 * Redirect loading component
 */
export const RedirectLoading: React.FC<{ text?: string }> = ({
  text = "Redirecting...",
}) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
    <LoadingSpinner size="md" color="primary" />
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

/**
 * Table/List loading component
 */
export const TableLoading: React.FC<{ text?: string }> = ({
  text = "Loading data...",
}) => (
  <LoadingComponent
    size="xl"
    color="gray"
    text={text}
    container="card"
    layout="horizontal"
  />
);

/**
 * Inline loading component (for smaller areas)
 */
export const InlineLoading: React.FC<{ text?: string }> = ({
  text = "Loading...",
}) => (
  <LoadingComponent
    size="sm"
    color="blue"
    text={text}
    container="inline"
    layout="horizontal"
  />
);

/**
 * Fullscreen loading overlay
 */
export const FullscreenLoading: React.FC<{ text?: string }> = ({
  text = "Loading...",
}) => (
  <LoadingComponent
    size="lg"
    color="white"
    text={text}
    container="fullscreen"
    layout="vertical"
  />
);

/**
 * Sidebar skeleton component
 */
export const SidebarSkeleton: React.FC = () => (
  <div className="flex h-full w-full flex-col gap-4 p-4">
    {/* Header skeleton */}
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="h-8 w-8 rounded" />
      <Skeleton className="h-4 w-32" />
    </div>

    {/* Management section skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <div className="space-y-1">
        <div className="flex items-center gap-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-26" />
        </div>
      </div>
    </div>

    {/* Monitoring section skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-18" />
      <div className="space-y-1">
        <div className="flex items-center gap-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-22" />
        </div>
        <div className="flex items-center gap-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-30" />
        </div>
        <div className="flex items-center gap-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>

    {/* Reports section skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-1">
        <div className="flex items-center gap-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-3 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-18" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Card skeleton component for dashboard cards
 */
export const CardSkeleton: React.FC = () => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
    <div className="flex items-center space-x-2">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-3 w-32" />
  </div>
);

/**
 * Table skeleton component for data tables
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({
  columns = 4,
}) => (
  <tr>
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="p-4">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}> = ({ rows = 5, columns = 4, showHeader = true }) => (
  <div className="rounded-md border">
    <table className="w-full">
      {showHeader && (
        <thead>
          <tr className="border-b">
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRowSkeleton key={index} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Chart skeleton component
 */
export const ChartSkeleton: React.FC<{ height?: string }> = ({
  height = "h-[300px]",
}) => (
  <div className={`rounded-lg border bg-card p-6 ${height}`}>
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-3 w-48" />
      <div
        className="flex items-end space-x-2 pt-4"
        style={{ height: "200px" }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="w-8"
            style={{
              height: `${Math.random() * 150 + 50}px`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
);
