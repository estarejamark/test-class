"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/contexts/settings.context";
import { settingsService } from "@/services/settings.service";
import { NotificationTemplate } from "@/types/settings";
import { Loader2, AlertCircle } from "lucide-react";

export function NotificationTemplatesSetup() {
  const { notificationTemplates, loading, error, refreshSettings } = useSettings();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const allTemplates = await settingsService.getAllTemplates();
        setTemplates(allTemplates);
      } catch (err) {
        console.error("Failed to fetch notification templates:", err);
        setOperationError("Failed to load notification templates. Please try again.");
      }
    };
    fetchTemplates();
  }, []);

  const validateForm = (formData: FormData): string | null => {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const content = formData.get("content") as string;
    const type = formData.get("type") as string;

    if (!name.trim()) {
      return "Template name is required.";
    }

    if (!category) {
      return "Category is required.";
    }

    if (!content.trim()) {
      return "Template content is required.";
    }

    if (!type) {
      return "Notification type is required.";
    }

    return null;
  };

  const handleSave = async (formData: FormData) => {
    const validationError = validateForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setIsSaving(true);
    setOperationError(null);
    try {
      const templateData = {
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        content: formData.get("content") as string,
        type: formData.get("type") as "SMS" | "EMAIL",
        variables: [], // Extract variables from content
      };

      if (selectedTemplate) {
        await settingsService.updateTemplate(selectedTemplate.id, templateData);
      } else {
        await settingsService.createTemplate(templateData);
      }

      await refreshSettings();
      // Refresh the list
      const allTemplates = await settingsService.getAllTemplates();
      setTemplates(allTemplates);
      setSelectedTemplate(null);
    } catch (err) {
      console.error("Failed to save notification template:", err);
      setOperationError("Failed to save notification template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (template: NotificationTemplate) => {
    setIsTesting(true);
    setOperationError(null);
    try {
      // TODO: Implement test notification sending
      console.log("Sending test notification", template);
    } catch (err) {
      console.error("Failed to send test notification:", err);
      setOperationError("Failed to send test notification. Please try again.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async (template: NotificationTemplate) => {
    setIsDeleting(true);
    setOperationError(null);
    try {
      await settingsService.deleteTemplate(template.id);
      await refreshSettings();
      // Refresh the list
      const allTemplates = await settingsService.getAllTemplates();
      setTemplates(allTemplates);
    } catch (err) {
      console.error("Failed to delete notification template:", err);
      setOperationError("Failed to delete notification template. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {operationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{operationError}</AlertDescription>
        </Alert>
      )}

      {/* Create/Edit Template Form */}
      <Card>
        <CardContent className="pt-6">
          <form action={handleSave} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={selectedTemplate?.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={selectedTemplate?.category || "Grades"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Account">Account</SelectItem>
                  <SelectItem value="Grades">Grades</SelectItem>
                  <SelectItem value="Attendance">Attendance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Notification Type</Label>
              <Select name="type" defaultValue={selectedTemplate?.type || "SMS"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Template Content</Label>
              <Textarea
                id="content"
                name="content"
                required
                defaultValue={selectedTemplate?.content}
                placeholder="Use {variableName} for dynamic content"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Available variables: {"{studentName}"}, {"{subject}"}, {"{quarter}"},
                {"{section}"}, {"{teacher}"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedTemplate ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  `${selectedTemplate ? "Update" : "Create"} Template`
                )}
              </Button>
              {selectedTemplate && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.category}</TableCell>
                  <TableCell>{template.type}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTest(template)}
                        disabled={isTesting}
                      >
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(template)}
                        disabled={isDeleting}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
