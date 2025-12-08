"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TimePicker, DateTimePicker } from "@/components/ui/datetime-picker";
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconX,
  IconRefresh,
  IconLoader,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";


// Generic interfaces
export interface BaseItem {
  id: string | number;
  status?: string;
  [key: string]: unknown;
}

export interface TableColumn {
  key: string;
  label: string;
  render?: (value: unknown, item: BaseItem) => React.ReactNode;
  searchable?: boolean;
}

export interface FormField {
  key: string;
  label: string;
  type: "text" | "email" | "select" | "number" | "time" | "datetime";
  required?: boolean;
  placeholder?: string;
  options?: string[] | { value: string; label: string }[];
  dependsOn?: string;
  dependsOnValue?: string | string[];
  gridColumn?: 1 | 2; // 1 for full width, 2 for half width
}

export interface FilterOption {
  key: string;
  label: string;
  options: string[] | { value: string; label: string }[];
}

export interface DataManagementTableProps {
  title: string;
  description: string;
  data: BaseItem[];
  columns: TableColumn[];
  formFields?: FormField[] | ((isEdit: boolean, item?: BaseItem, formData?: Record<string, unknown>) => FormField[]);
  filterOptions?: FilterOption[];
  customFilter?: (items: BaseItem[], filters: Record<string, string>) => BaseItem[];
  onAdd?: (item: Omit<BaseItem, "id">) => void | Promise<void>;
  onEdit?: (id: string | number, item: Partial<BaseItem>) => void | Promise<void>;
  onDelete?: (id: string | number) => void | Promise<void>;
  onStatusToggle?: (id: string | number) => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
  onChangeEmail?: (id: string | number) => void | Promise<void>;
  onResetPassword?: (id: string | number) => void | Promise<void>;
  onResetOtp?: (id: string | number) => void | Promise<void>;
  onAssignStudent?: (student: BaseItem) => void;
  onMoveStudent?: (student: BaseItem) => void;
  onMarkInactive?: (student: BaseItem) => void;
  onViewParentContacts?: (student: BaseItem) => void;
  onViewClassList?: (section: BaseItem) => void;
  onViewProfile?: (id: string | number) => void | Promise<void>;
  onViewPackage?: (item: BaseItem) => void;
  searchPlaceholder?: string;
  addButtonText?: string;
  editModalTitle?: string;
  addModalTitle?: string;
  editModalDescription?: string;
  addModalDescription?: string;
  showAddButton?: boolean;
  getBadgeColor?: (key: string, value: unknown) => string;
  actions?: {
    edit?: boolean;
    statusToggle?: boolean;
    delete?: boolean;
    changeEmail?: boolean;
    resetPassword?: boolean;
    resetOtp?: boolean;
    assignStudent?: boolean;
    moveStudent?: boolean;
    markInactive?: boolean;
    viewParentContacts?: boolean;
    viewClassList?: boolean;
    viewProfile?: boolean;
    viewPackage?: boolean;
  } | ((item: BaseItem) => {
    edit?: boolean;
    statusToggle?: boolean;
    delete?: boolean;
    changeEmail?: boolean;
    resetPassword?: boolean;
    resetOtp?: boolean;
    assignStudent?: boolean;
    moveStudent?: boolean;
    markInactive?: boolean;
    viewParentContacts?: boolean;
    viewClassList?: boolean;
    viewProfile?: boolean;
    viewPackage?: boolean;
  });
}

export function DataManagementTable({
  title,
  description,
  data,
  columns,
  formFields,
  filterOptions = [],
  customFilter,
  onAdd,
  onEdit,
  onDelete,
  onStatusToggle,
  onRefresh,
  onChangeEmail,
  onResetPassword,
  onResetOtp,
  onAssignStudent,
  onMoveStudent,
  onMarkInactive,
  onViewParentContacts,
  onViewClassList,
  onViewProfile,
  searchPlaceholder = "Search...",
  addButtonText = "Add Item",
  editModalTitle = "Edit Item",
  addModalTitle = "Add New Item",
  editModalDescription = "Update the item details below.",
  addModalDescription = "Fill in the details to create a new item.",
  showAddButton = true,
  getBadgeColor,
  actions = { edit: true, statusToggle: true, delete: true },
}: DataManagementTableProps) {
  const [items, setItems] = useState<BaseItem[]>(data);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to get form fields array
  const getFormFields = (): FormField[] => {
    return typeof formFields === 'function' ? formFields(isEditMode, editingItem ? items.find(item => item.id === editingItem) : undefined, formData) : (formFields || []);
  };
  const [deletingItemIds, setDeletingItemIds] = useState<Set<string | number>>(
    new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BaseItem | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Prevent auto-selection when modal opens in edit mode
  useEffect(() => {
    if (isModalOpen && isEditMode && firstInputRef.current) {
      const timeoutId = setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.blur();
          firstInputRef.current.setSelectionRange(0, 0);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isModalOpen, isEditMode]);

  // Update items when data prop changes
  useEffect(() => {
    setItems(data);
  }, [data]);

  // Filter items based on search term and filters
  const filteredItems = items.filter((item) => {
    // Search filter
    const searchableColumns = columns.filter((col) => col.searchable !== false);
    const matchesSearch =
      searchTerm === "" ||
      searchableColumns.some((col) => {
        const value = item[col.key];
        return (
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

    // Additional filters
    const matchesFilters = customFilter
      ? customFilter([item], filters).length > 0
      : Object.entries(filters).every(([key, value]) => {
          if (value === "All" || value === "") return true;
          return item[key] === value;
        });

    return matchesSearch && matchesFilters;
  });

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    const initialFormData: Record<string, unknown> = {};
    getFormFields().forEach((field) => {
      initialFormData[field.key] = "";
    });
    setFormData(initialFormData);
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingItem(null);
    setSubmitError(null);
    setFormErrors({});
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setSubmitError(null);
    setFormErrors({});
    setIsSubmitting(true);

    // Store original items for rollback on error
    const originalItems = [...items];

    try {
      if (isEditMode && editingItem !== null) {
        // For editing, let the parent component handle state updates
        await onEdit?.(editingItem, formData);
        // ✅ Update local table data instantly
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingItem ? { ...item, ...formData } : item
          )
        );
      } else {
        // Add new item - do optimistic update
        const maxId = items.length > 0 ? Math.max(...items.map((i) => {
          const id = i.id;
          return typeof id === 'number' ? id : parseInt(String(id)) || 0;
        })) : 0;
        const newItem: BaseItem = {
          ...formData,
          id: maxId + 1,
          status: (formData.status as string) || "active",
        };
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        await onAdd?.(newItem);
      }

      // Only reset form if operation succeeds
      resetForm();
    } catch (error) {
      console.error("Form submission error:", error);

      // Rollback optimistic updates on error
      setItems(originalItems);

      // Handle validation errors
      if (error instanceof Error) {
        const errorMessage = error.message;

        // Check if it's a field-specific validation error
        if (
          errorMessage.includes("required") ||
          errorMessage.includes("already exists")
        ) {
          // Try to map error to specific fields
          const fieldErrors: Record<string, string> = {};

          getFormFields().forEach((field) => {
            if (errorMessage.toLowerCase().includes(field.key.toLowerCase())) {
              fieldErrors[field.key] = errorMessage;
            }
          });

          if (Object.keys(fieldErrors).length > 0) {
            setFormErrors(fieldErrors);
          } else {
            setSubmitError(errorMessage);
          }
        } else {
          setSubmitError(errorMessage);
        }
      } else {
        setSubmitError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = () => {
    const initialFormData: Record<string, unknown> = {};
    getFormFields().forEach((field) => {
      initialFormData[field.key] = "";
    });
    setFormData(initialFormData);
    setIsEditMode(false);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (itemId: string | number) => {
    const itemToEdit = items.find((item) => item.id === itemId);
    if (itemToEdit) {
      // Set edit mode first
      setIsEditMode(true);
      setEditingItem(itemId);

      // Calculate form data with fields for edit mode
      const editFormData: Record<string, unknown> = {};
      const fields = typeof formFields === 'function' ? formFields(true, itemToEdit) : (formFields || []);
      fields.forEach((field) => {
        editFormData[field.key] = itemToEdit[field.key] || "";
      });

      // Special handling for section field when gradeLevel is present (for ManageUsersComponent)
      if (editFormData["gradeLevel"] && editFormData["section"] && typeof editFormData["section"] === "string") {
        // Extract the section name (remove any existing grade prefix)
        const sectionName = editFormData["section"].split("-").pop() || editFormData["section"];
        editFormData["section"] = `${editFormData["gradeLevel"]}-${sectionName}`;
      }

      // Ensure dependent fields work by setting the role in formData even if not displayed
      if (itemToEdit.role) {
        editFormData["role"] = itemToEdit.role;
      }

      setFormData(editFormData);
      setIsModalOpen(true);
    }
  };

  const handleStatusToggle = (itemId: string | number) => {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? { ...item, status: item.status === "active" ? "inactive" : "active" }
        : item
    );
    setItems(updatedItems);
    onStatusToggle?.(itemId);
  };

  const handleDeleteClick = (item: BaseItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    const itemId = itemToDelete.id;
    setDeleteDialogOpen(false);
    setItemToDelete(null);

    // Add to deleting set to show loading state
    setDeletingItemIds((prev) => new Set(prev).add(itemId));

    try {
      if (onDelete) {
        // Call the delete handler (can be sync or async)
        const result = onDelete(itemId);

        // If it's a promise, await it
        if (result instanceof Promise) {
          await result;
        }

        // Remove from local state after successful deletion
        setItems((prev) => prev.filter(item => item.id !== itemId));
      }
    } catch (error) {
      // If delete fails, don't remove from local state
      console.error("Delete operation failed:", error);

      // Show error message to user instead of re-throwing
      const errorMessage = error instanceof Error ? error.message : "Failed to delete item";
      setSubmitError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => {
        setSubmitError(null);
      }, 5000);
    } finally {
      // Remove from deleting set regardless of success/failure
      setDeletingItemIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      resetForm();
    } else {
      setIsModalOpen(open);
    }
  };

  const getFilterValue = (key: string) => {
    return filters[key] || "All";
  };

  const setFilterValue = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value && value !== "All"
  );

  const getColumnWidth = (index: number, totalColumns: number, hasActions: boolean) => {
    if (hasActions) {
      return `calc((100% - 6rem) / ${totalColumns})`;
    } else {
      return `${100 / totalColumns}%`;
    }
  };

  const getItemActions = (item: BaseItem) => {
    if (typeof actions === 'function') {
      return actions(item);
    }
    return actions;
  };

  const hasActions = !!(
    (typeof actions === 'object' && (
      actions.edit ||
      actions.statusToggle ||
      actions.delete ||
      actions.changeEmail ||
      actions.resetPassword ||
      actions.resetOtp ||
      actions.assignStudent ||
      actions.moveStudent ||
      actions.markInactive ||
      actions.viewParentContacts ||
      actions.viewClassList ||
      actions.viewPackage
    )) ||
    typeof actions === 'function'
  );

  const renderFormField = (field: FormField, index: number) => {
    // Check if field should be shown based on dependencies
    if (field.dependsOn && field.dependsOnValue) {
      const dependentValue = formData[field.dependsOn];
      const expectedValues = Array.isArray(field.dependsOnValue)
        ? field.dependsOnValue
        : [field.dependsOnValue];

      if (!expectedValues.includes(String(dependentValue))) {
        return null;
      }
    }

    const isFirstField = index === 0;
    const fieldValue = String(formData[field.key] || "");
    const commonProps = {
      id: field.key,
      value: fieldValue,
      required: field.required,
      ...(isFirstField && { ref: firstInputRef }),
    };

    switch (field.type) {
      case "select":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && "*"}
            </Label>
            <Select
              value={fieldValue}
              onValueChange={(value) => handleInputChange(field.key, value)}>
              <SelectTrigger
                className={
                  formErrors[field.key]
                    ? "border-red-500 focus:border-red-500 w-full"
                    : "w-full"
                }>
                <SelectValue
                  placeholder={
                    field.placeholder || `Select ${field.label.toLowerCase()}`
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => {
                  const value =
                    typeof option === "string" ? option : option.value;
                  const label =
                    typeof option === "string" ? option : option.label;
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {formErrors[field.key] && (
              <p className="text-sm text-red-600">{formErrors[field.key]}</p>
            )}
          </div>
        );

      case "email":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && "*"}
            </Label>
            <Input
              {...commonProps}
              type="email"
              placeholder={field.placeholder}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              autoFocus={false}
              className={
                formErrors[field.key]
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }
            />
            {formErrors[field.key] && (
              <p className="text-sm text-red-600">{formErrors[field.key]}</p>
            )}
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && "*"}
            </Label>
            <Input
              {...commonProps}
              type="number"
              placeholder={field.placeholder}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              autoFocus={false}
              className={
                formErrors[field.key]
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }
            />
            {formErrors[field.key] && (
              <p className="text-sm text-red-600">{formErrors[field.key]}</p>
            )}
          </div>
        );

      case "time":
        return (
          <div key={field.key} className="space-y-2">
            <TimePicker
              label={field.label}
              value={fieldValue}
              onChange={(value) => handleInputChange(field.key, value)}
              required={field.required}
              placeholder={field.placeholder}
              id={field.key}
            />
          </div>
        );

      case "datetime":
        return (
          <div key={field.key} className="space-y-2">
            <DateTimePicker
              label={field.label}
              value={
                fieldValue
                  ? (() => {
                      // Parse the datetime value if it exists
                      if (
                        typeof fieldValue === "string" &&
                        fieldValue.includes("T")
                      ) {
                        const [date, time] = fieldValue.split("T");
                        return { date, time: time.slice(0, 5) }; // Remove seconds
                      }
                      return { date: "", time: "" };
                    })()
                  : { date: "", time: "" }
              }
              onChange={(value) => {
                // Combine date and time into ISO string format
                if (value.date && value.time) {
                  const datetime = `${value.date}T${value.time}:00`;
                  handleInputChange(field.key, datetime);
                } else {
                  handleInputChange(field.key, "");
                }
              }}
              required={field.required}
              placeholder={field.placeholder}
              id={field.key}
            />
          </div>
        );

      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && "*"}
            </Label>
            <Input
              {...commonProps}
              placeholder={field.placeholder}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              autoFocus={false}
              className={
                formErrors[field.key]
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }
            />
            {formErrors[field.key] && (
              <p className="text-sm text-red-600">{formErrors[field.key]}</p>
            )}
          </div>
        );
    }
  };

  const getDefaultBadgeColor = (value: unknown) => {
    if (typeof value === "string") {
      switch (value.toLowerCase()) {
        case "active":
          return "bg-green-100 text-green-800";
        case "inactive":
          return "bg-red-100 text-red-800";
        case "admin":
          return "bg-red-100 text-red-800";
        case "teacher":
          return "bg-blue-100 text-blue-800";
        case "student":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    }
    return "bg-gray-100 text-gray-800";
  };

  function onViewPackage(item: BaseItem): void {
    throw new Error("Function not implemented.");
  }

  return (
    <>
      <div className="h-6" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-card text-card-foreground rounded-xl border shadow-sm">
          <div className="p-6">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold leading-none tracking-tight">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="p-6 pt-0">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mb-6 items-center justify-between overflow-x-hidden">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-[360px]">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-accent rounded-sm p-1"
                  aria-label="Clear search">
                  <IconX className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dynamic Filters and Actions */}
            <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
              {/* Filter Dropdowns */}
              {filterOptions.map((filter) => (
                <Select
                  key={filter.key}
                  value={getFilterValue(filter.key)}
                  onValueChange={(value) => setFilterValue(filter.key, value)}>
                  {/* Fixed width select trigger to prevent layout widening */}
                  <SelectTrigger className="w-[180px] truncate">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All {filter.label}</SelectItem>
                    {filter.options.map((option) => {
                      const value = typeof option === "string" ? option : option.value;
                      const label = typeof option === "string" ? option : option.label;
                      return (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ))}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-sm whitespace-nowrap">
                  Clear All Filters
                </Button>
              )}

              {/* Refresh Button */}
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-sm whitespace-nowrap">
                  <IconRefresh
                    className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              )}

              {/* Add Item Button */}
              {showAddButton !== false && (
                <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={handleAddItem}
                      className="btn-ctu-primary shadow-sm whitespace-nowrap">
                      <IconPlus className="h-4 w-4 mr-2" />
                      {addButtonText}
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? editModalTitle : addModalTitle}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditMode ? editModalDescription : addModalDescription}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Dynamic Form Fields */}
                    {getFormFields().reduce<React.ReactNode[]>((acc, field, index) => {
                      const fieldComponent = renderFormField(field, index);
                      if (!fieldComponent) return acc;

                      // Handle 2-column field groups
                      if (field.gridColumn === 2) {
                        const nextFieldIndex = index + 1;
                        const nextField = getFormFields()[nextFieldIndex];
                        if (nextField && nextField.gridColumn === 2) {
                          const nextFieldComponent = renderFormField(
                            nextField,
                            nextFieldIndex
                          );
                          acc.splice(nextFieldIndex, 1);
                          acc.push(
                            <div
                              key={`grid-${index}`}
                              className="grid grid-cols-2 gap-4">
                              {fieldComponent}
                              {nextFieldComponent}
                            </div>
                          );
                          return acc;
                        }
                      }

                      acc.push(fieldComponent);
                      return acc;
                    }, [])}

                    {/* Submit Error */}
                    {submitError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{submitError}</p>
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-2 pt-6 border-t border-border/50">
                      <Button
                        type="button"
                        variant="outline"
                        className="btn-ctu-secondary"
                        onClick={() => resetForm()}
                        disabled={isSubmitting}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="btn-ctu-primary"
                        disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                            {isEditMode ? "Updating..." : "Adding..."}
                          </>
                        ) : (
                          <>{isEditMode ? "Update Item" : "Add Item"}</>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </div>
          {/* Items Table */}
          <div className="rounded-lg border shadow-sm card-enhanced w-full overflow-x-auto">
            <div className="max-w-full overflow-x-hidden">
              <div className="min-w-full">
                <Table className="table-auto w-full border-collapse table-enhanced">
                  <TableHeader>
                    <TableRow className="table-header-enhanced hover:from-primary/8 hover:to-primary/15 transition-all duration-200">
                      {columns.map((column) => (
                        <TableHead
                          key={column.key}
                          className="font-semibold text-foreground truncate min-w-[120px] max-w-[220px] break-words"
                        >
                          {column.label}
                        </TableHead>
                      ))}
                      {hasActions && (
                        <TableHead className="font-semibold text-foreground w-36 text-right">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length + (hasActions ? 1 : 0)}
                          className="text-center py-12 text-muted-foreground animate-fade-in"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <IconSearch className="h-8 w-8 text-muted-foreground/40" />
                            <span>No items found</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-accent/50 transition-colors duration-150 animate-fade-in"
                        >
                          {columns.map((column) => (
                            <TableCell
                              key={column.key}
                              className={`${
                                column.key === columns[0]?.key ? "font-medium" : ""
                              } px-2 py-3 min-w-[120px] max-w-[220px] break-words truncate overflow-hidden text-ellipsis whitespace-nowrap`}
                            >
                              {column.render ? (
                                column.render(item[column.key], item)
                              ) : column.key === "status" || column.key.includes("role") ? (
                                <Badge
                                  className={
                                    getBadgeColor
                                      ? getBadgeColor(column.key, item[column.key])
                                      : getDefaultBadgeColor(item[column.key])
                                  }
                                >
                                  {typeof item[column.key] === "string"
                                    ? (item[column.key] as string)
                                        .charAt(0)
                                        .toUpperCase() +
                                      (item[column.key] as string).slice(1)
                                    : String(item[column.key])}
                                </Badge>
                              ) : (
                                String(item[column.key] || "")
                              )}
                            </TableCell>
                          ))}

                          {hasActions && (
                            <TableCell className="w-36 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <IconDots className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {getItemActions(item).edit && (
                                    <DropdownMenuItem onClick={() => handleEditItem(item.id)}>
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  {getItemActions(item).statusToggle && item.status && (
                                    <DropdownMenuItem onClick={() => handleStatusToggle(item.id)}>
                                      {item.status === "active" ? "Deactivate" : "Activate"}
                                    </DropdownMenuItem>
                                  )}
                                  {getItemActions(item).viewProfile && (
                                    <DropdownMenuItem onClick={() => onViewProfile?.(item.id)}>
                                      View Profile
                                    </DropdownMenuItem>
                                  )}
                                  {(getItemActions(item).edit || getItemActions(item).statusToggle || getItemActions(item).viewProfile) &&
                                    (getItemActions(item).delete ||
                                      getItemActions(item).changeEmail ||
                                      getItemActions(item).resetPassword ||
                                      getItemActions(item).resetOtp ||
                                      getItemActions(item).assignStudent ||
                                      getItemActions(item).moveStudent ||
                                      getItemActions(item).markInactive ||
                                      getItemActions(item).viewParentContacts) && <DropdownMenuSeparator />}

                                  {getItemActions(item).assignStudent && (
                                    <DropdownMenuItem onClick={() => onAssignStudent?.(item)}>
                                      Assign Student
                                    </DropdownMenuItem>
                                  )}
                                  {getItemActions(item).moveStudent && (
                                    <DropdownMenuItem onClick={() => onMoveStudent?.(item)}>
                                      Move Student
                                    </DropdownMenuItem>
                                  )}
                                  {getItemActions(item).markInactive && (
                                    <DropdownMenuItem onClick={() => onMarkInactive?.(item)}>
                                      Mark Inactive
                                    </DropdownMenuItem>
                                  )}
                                  {getItemActions(item).viewParentContacts && (
                                    <DropdownMenuItem onClick={() => onViewParentContacts?.(item)}>
                                      View Parent Contacts
                                    </DropdownMenuItem>
                                  )}
                                  {getItemActions(item).viewClassList && (
                                    <DropdownMenuItem onClick={() => onViewClassList?.(item)}>
                                      View Class List
                                    </DropdownMenuItem>
                                  )}
                                  {getItemActions(item).viewPackage && (
                                    <DropdownMenuItem onClick={() => onViewPackage?.(item)}>
                                      View Package
                                    </DropdownMenuItem>
                                  )}
                                  {(getItemActions(item).assignStudent ||
                                    getItemActions(item).moveStudent ||
                                    getItemActions(item).markInactive ||
                                    getItemActions(item).viewParentContacts ||
                                    getItemActions(item).viewClassList ||
                                    getItemActions(item).viewPackage) &&
                                    (getItemActions(item).changeEmail ||
                                      getItemActions(item).resetPassword ||
                                      getItemActions(item).resetOtp) && <DropdownMenuSeparator />}

                                  {getItemActions(item).changeEmail && (
                                    <DropdownMenuItem onClick={() => onChangeEmail?.(item.id)}>
                                      Change Email
                                    </DropdownMenuItem>
                                  )}
                                  {getItemActions(item).resetPassword && (
                                    <DropdownMenuItem onClick={() => onResetPassword?.(item.id)}>
                                      Reset Password
                                    </DropdownMenuItem>
                                  )}
                                  {getItemActions(item).resetOtp && (
                                    <DropdownMenuItem onClick={() => onResetOtp?.(item.id)}>
                                      Reset OTP
                                    </DropdownMenuItem>
                                  )}
                                  {(getItemActions(item).changeEmail ||
                                    getItemActions(item).resetPassword ||
                                    getItemActions(item).resetOtp) &&
                                    getItemActions(item).delete && <DropdownMenuSeparator />}
                                  {getItemActions(item).delete && (
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => handleDeleteClick(item)}
                                      disabled={deletingItemIds.has(item.id)}
                                    >
                                      {deletingItemIds.has(item.id) ? (
                                        <>
                                          <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                                          Deleting...
                                        </>
                                      ) : (
                                        "Delete"
                                      )}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
            {/* Results Summary */}
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <span>
                Showing {filteredItems.length} of {items.length} items
              </span>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        itemName={String(itemToDelete?.subjectName || itemToDelete?.name || itemToDelete?.title || `Item ${itemToDelete?.id}`)}
        isLoading={deletingItemIds.has(itemToDelete?.id || 0)}
      />

    </>
  );
}
