"use client";

import { useEffect, useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui";
import { Loader2 } from "lucide-react";
import { useSettings } from "@/contexts/settings.context";
import { SchoolYearSetup } from "@/components/dashboard/settings/SchoolYearSetup";
import { SchoolProfileSetup } from "@/components/dashboard/settings/SchoolProfileSetup";
import { SecuritySetup } from "@/components/dashboard/settings/SecuritySetup";
import { NotificationTemplatesSetup } from "@/components/dashboard/settings/NotificationTemplatesSetup";
import { DataBackupSetup } from "@/components/dashboard/settings/DataBackupSetup";
import { useAuth } from "@/contexts/auth.context";
import { Role } from "@/types/auth";
import {
  NotificationPreferences,
  Appearance,
  TeacherAdviserSettings
} from "@/types/teacher-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, Users, HelpCircle, Save, Sun, Moon } from "lucide-react";
import { settingsService } from "@/services/settings.service";
import { useTheme } from "next-themes";

export function SettingsComponent() {
  const { user, profile } = useAuth();
  const { loading, error, refreshSettings } = useSettings();
  const { theme, setTheme } = useTheme();

  // Create user-specific theme key
  const userThemeKey = user?.id ? `ctu-theme-${user.id}` : 'ctu-theme-default';

  // Get current user theme
  const [userTheme, setUserTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(userThemeKey) || 'light';
    }
    return 'light';
  });

  // Update user theme when user changes
  useEffect(() => {
    const savedTheme = localStorage.getItem(userThemeKey) || 'light';
    setUserTheme(savedTheme);
    setTheme(savedTheme);
  }, [user?.id, userThemeKey, setTheme]);

  // Function to handle theme toggle with user-specific storage
  const handleThemeToggle = () => {
    const newTheme = userTheme === 'light' ? 'dark' : 'light';
    setUserTheme(newTheme);
    setTheme(newTheme);
    localStorage.setItem(userThemeKey, newTheme);
  };

  const [teacherSettings, setTeacherSettings] = useState<TeacherAdviserSettings>({
    notificationPreferences: {
      teachingAlerts: {
        scheduleChanges: true,
        attendanceIssues: true,
        gradeSubmissionReminder: true,
      },
      channels: {
        inApp: true,
        email: true,
        sms: false,
      },
    },
    appearance: {
      defaultGradingView: 'table',
      displayOptions: {
        showArchivedSubjects: false,
        showUnpublishedSections: false,
        groupClassesByTime: true,
      },
    },
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has access to settings
    if (!user || (user.role !== Role.ADMIN && user.role !== Role.TEACHER && !profile?.isAdviser)) {
      console.error("Unauthorized access to settings");
    }
  }, [user, profile?.isAdviser]);

  // Load teacher settings from API on component mount
  useEffect(() => {
    const loadTeacherSettings = async () => {
      if (user?.role === Role.TEACHER || profile?.isAdviser) {
        setIsLoadingSettings(true);
        setSettingsError(null);
        try {
          const settings = await settingsService.getTeacherSettings();
          setTeacherSettings(settings);
        } catch (error) {
          // Silently handle API errors and use default settings
          console.warn('Using default teacher settings due to API unavailability');
          // Keep default settings - no error message shown to user
        } finally {
          setIsLoadingSettings(false);
        }
      }
    };

    loadTeacherSettings();
  }, [user?.role]);



  const handleSaveSettings = async () => {
    try {
      await settingsService.updateTeacherSettings(teacherSettings);
      // Store settings in localStorage for application behavior
      localStorage.setItem('teacherSettings', JSON.stringify(teacherSettings));
      setHasChanges(false);
      setSettingsError(null);
    } catch (error) {
      console.error('Failed to save teacher settings:', error);
      setSettingsError('Failed to save settings. Please try again.');
    }
  };

  const updateNotificationPreferences = (updates: Partial<NotificationPreferences>) => {
    setTeacherSettings(prev => ({
      ...prev,
      notificationPreferences: { ...prev.notificationPreferences, ...updates }
    }));
    setHasChanges(true);
  };

  const updateAppearance = (updates: Partial<Appearance>) => {
    setTeacherSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        ...updates,
      }
    }));
    setHasChanges(true);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Admin Settings
  if (user?.role === Role.ADMIN) {
    return (
      <>
        <div className="h-6" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-card text-card-foreground rounded-xl border shadow-sm">
            <div className="p-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold leading-none tracking-tight">
                  System Settings
                </h2>
                <p className="text-sm text-muted-foreground">
                  Configure and maintain core aspects of the academic system. Select a tab to manage settings.
                </p>
              </div>
            </div>
            <div className="p-6 pt-0">
              <Tabs defaultValue="school-year" className="w-full">
                <TabsList>
                  <TabsTrigger value="school-year">School Year Setup</TabsTrigger>
                  <TabsTrigger value="school-profile">School Profile & Branding</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="notifications">Notification Templates</TabsTrigger>
                  <TabsTrigger value="backup">Data Backup & Retention</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                </TabsList>
                <TabsContent value="school-year">
                  <SchoolYearSetup />
                </TabsContent>
                <TabsContent value="school-profile">
                  <SchoolProfileSetup />
                </TabsContent>
                <TabsContent value="security">
                  <SecuritySetup />
                </TabsContent>
                <TabsContent value="notifications">
                  <NotificationTemplatesSetup />
                </TabsContent>
                <TabsContent value="backup">
                  <DataBackupSetup />
                </TabsContent>
              <TabsContent value="appearance">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Theme</Label>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred theme for the application
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleThemeToggle}
                        className="flex items-center gap-2"
                      >
                        {userTheme === "light" ? (
                          <>
                            <Moon className="h-4 w-4" />
                            Dark Mode
                          </>
                        ) : (
                          <>
                            <Sun className="h-4 w-4" />
                            Light Mode
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Teacher-Adviser Settings
  return (
    <>
      <div className="h-6" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-card text-card-foreground rounded-xl border shadow-sm">
          <div className="p-6">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold leading-none tracking-tight">
                {profile?.isAdviser ? 'Adviser Settings' : user?.role === Role.TEACHER ? 'Teacher Settings' : 'Settings'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {profile?.isAdviser
                  ? 'Manage your advisory responsibilities and communication preferences. Select a tab to configure settings.'
                  : user?.role === Role.TEACHER
                  ? 'Customize your teaching experience and preferences. Select a tab to configure settings.'
                  : 'Configure your settings. Select a tab to manage preferences.'
                }
              </p>
            </div>
          </div>
          <div className="p-6 pt-0">
            {hasChanges && (
              <div className="mb-4 flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <Save className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">You have unsaved changes</span>
                </div>
                <Button onClick={handleSaveSettings} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            )}
            {settingsError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-800">{settingsError}</span>
              </div>
            )}
            <Tabs defaultValue="notifications" className="w-full">
              <TabsList>
                <TabsTrigger value="notifications">
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Preferences
                </TabsTrigger>
                {user?.role === Role.TEACHER && (
                  <TabsTrigger value="teaching">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Teaching Preferences
                  </TabsTrigger>
                )}

                <TabsTrigger value="appearance">
                  <Sun className="w-4 h-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="help">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </TabsTrigger>
              </TabsList>

            <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose what notifications you want to receive and how.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Teaching Alerts</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="schedule-changes">Schedule Changes</Label>
                          <Switch
                            id="schedule-changes"
                            checked={teacherSettings.notificationPreferences.teachingAlerts.scheduleChanges}
                            onCheckedChange={(checked) =>
                              updateNotificationPreferences({
                                teachingAlerts: {
                                  ...teacherSettings.notificationPreferences.teachingAlerts,
                                  scheduleChanges: checked
                                }
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="attendance-issues">Attendance Issues</Label>
                          <Switch
                            id="attendance-issues"
                            checked={teacherSettings.notificationPreferences.teachingAlerts.attendanceIssues}
                            onCheckedChange={(checked) =>
                              updateNotificationPreferences({
                                teachingAlerts: {
                                  ...teacherSettings.notificationPreferences.teachingAlerts,
                                  attendanceIssues: checked
                                }
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="grade-reminder">Grade Submission Reminder</Label>
                          <Switch
                            id="grade-reminder"
                            checked={teacherSettings.notificationPreferences.teachingAlerts.gradeSubmissionReminder}
                            onCheckedChange={(checked) =>
                              updateNotificationPreferences({
                                teachingAlerts: {
                                  ...teacherSettings.notificationPreferences.teachingAlerts,
                                  gradeSubmissionReminder: checked
                                }
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>




                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="teaching">
                <Card>
                  <CardHeader>
                    <CardTitle>Teaching Preferences</CardTitle>
                    <CardDescription>Customize your grading and attendance management experience.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="grading-view">Default Grading View</Label>
                      <Select
                        value={teacherSettings.appearance.defaultGradingView}
                        onValueChange={(value: 'table' | 'card' | 'compact') =>
                          updateAppearance({ defaultGradingView: value })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="table">Table View</SelectItem>
                          <SelectItem value="card">Card View</SelectItem>
                          <SelectItem value="compact">Compact View</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>



              <TabsContent value="appearance">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Theme</Label>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred theme for the application
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleThemeToggle}
                        className="flex items-center gap-2"
                      >
                        {userTheme === "light" ? (
                          <>
                            <Moon className="h-4 w-4" />
                            Dark Mode
                          </>
                        ) : (
                          <>
                            <Sun className="h-4 w-4" />
                            Light Mode
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="help">
                <Card>
                  <CardHeader>
                    <CardTitle>Help & Support</CardTitle>
                    <CardDescription>Get help with using the system and contact support.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Quick Help</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Use the Notification Preferences tab to customize alerts</li>
                          <li>• Set your default grading view in the Teaching tab</li>
                          <li>• Customize your appearance settings in the Appearance tab</li>
                          <li>• Changes are saved automatically when you modify settings</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Contact Support</h4>
                        <p className="text-sm text-muted-foreground">
                          For technical support or questions about the system, please contact the IT department at it-support@adsm.edu.ph
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
