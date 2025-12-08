"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLoading } from "@/components/utils";
import {
  IconBell,
  IconCheck,
  IconUser,
  IconFileDescription,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/auth.context";

// Types for notifications
interface Notification {
  id: string;
  type: "PACKAGE_PUBLISHED" | "FEEDBACK_RESPONSE" | "CORRECTION_UPDATE" | "GENERAL";
  title: string;
  message: string;
  sender: {
    name: string;
    role: string;
  };
  isRead: boolean;
  createdAt: string;
  relatedRecordId?: string;
}

export function StudentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);

        // TODO: Replace with actual API call
        // For now, using mock data
        const mockNotifications: Notification[] = [
          {
            id: "1",
            type: "PACKAGE_PUBLISHED",
            title: "Q1 Official Package Published",
            message: "Your Q1 grades and attendance records have been officially published. Please review and acknowledge.",
            sender: {
              name: "Dr. Maria Santos",
              role: "Adviser",
            },
            isRead: false,
            createdAt: "2024-01-20T09:00:00Z",
            relatedRecordId: "package-q1-2024",
          },
          {
            id: "2",
            type: "FEEDBACK_RESPONSE",
            title: "Teacher Feedback Response",
            message: "Your response to the Mathematics feedback has been reviewed by Prof. Juan Dela Cruz.",
            sender: {
              name: "Prof. Juan Dela Cruz",
              role: "Teacher",
            },
            isRead: false,
            createdAt: "2024-01-18T14:30:00Z",
            relatedRecordId: "feedback-math-q1",
          },
          {
            id: "3",
            type: "CORRECTION_UPDATE",
            title: "Correction Request Approved",
            message: "Your attendance correction request for January 10, 2024 has been approved.",
            sender: {
              name: "Ms. Ana Rodriguez",
              role: "Teacher",
            },
            isRead: true,
            createdAt: "2024-01-15T11:15:00Z",
            relatedRecordId: "correction-att-001",
          },
          {
            id: "4",
            type: "GENERAL",
            title: "Parent-Teacher Conference Reminder",
            message: "Don't forget the parent-teacher conference scheduled for next Friday at 2:00 PM.",
            sender: {
              name: "Dr. Maria Santos",
              role: "Adviser",
            },
            isRead: true,
            createdAt: "2024-01-12T08:00:00Z",
          },
          {
            id: "5",
            type: "CORRECTION_UPDATE",
            title: "Correction Request Rejected",
            message: "Your grade correction request for Science Q1 has been reviewed. Please see the reviewer's remarks.",
            sender: {
              name: "Mr. Carlos Mendoza",
              role: "Teacher",
            },
            isRead: true,
            createdAt: "2024-01-10T16:45:00Z",
            relatedRecordId: "correction-grade-002",
          },
        ];

        setNotifications(mockNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Replace with actual API call
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "PACKAGE_PUBLISHED":
        return <IconFileDescription className="w-5 h-5 text-blue-500" />;
      case "FEEDBACK_RESPONSE":
        return <IconUser className="w-5 h-5 text-green-500" />;
      case "CORRECTION_UPDATE":
        return <IconAlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <IconBell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "PACKAGE_PUBLISHED":
        return "Package Published";
      case "FEEDBACK_RESPONSE":
        return "Feedback Response";
      case "CORRECTION_UPDATE":
        return "Correction Update";
      default:
        return "General";
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    filter === "unread" ? !notification.isRead : true
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return <DashboardLoading text="Loading notifications..." />;
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-6 py-4 md:py-6 max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with important messages from your teachers and advisers
            </p>
          </div>

          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <IconCheck className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <IconBell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </h3>
                <p className="text-muted-foreground text-center">
                  {filter === "unread"
                    ? "You've read all your notifications. Check back later for updates!"
                    : "You'll see important updates from your teachers and advisers here."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-colors ${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">
                          {notification.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(notification.type)}
                        </Badge>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          From {notification.sender.name} ({notification.sender.role}) •
                          {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </div>

                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <IconCheck className="w-4 h-4 mr-1" />
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Notification Types Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notification Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <IconFileDescription className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium text-sm">Package Published</div>
                  <div className="text-xs text-muted-foreground">
                    When quarterly packages are officially released
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <IconUser className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium text-sm">Feedback Response</div>
                  <div className="text-xs text-muted-foreground">
                    Updates on your feedback submissions
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <IconAlertTriangle className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-medium text-sm">Correction Update</div>
                  <div className="text-xs text-muted-foreground">
                    Status changes on your correction requests
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <IconBell className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-sm">General</div>
                  <div className="text-xs text-muted-foreground">
                    Important announcements and reminders
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
