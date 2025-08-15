"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, XCircle, Info, X } from "lucide-react";

type NotificationType = "success" | "error" | "warning" | "info";

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
};

type NotificationContextType = {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
};

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const addNotification = React.useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newNotification = { ...notification, id };
      
      setNotifications((prev) => [...prev, newNotification]);

      if (notification.duration !== 0) {
        setTimeout(() => {
          removeNotification(id);
        }, notification.duration || 5000);
      }
    },
    []
  );

  const removeNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = React.useContext(NotificationContext);
  
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  
  return context;
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const { type, title, message } = notification;

  const icons = {
    success: <CheckCircle className="size-5 text-green-500" />,
    error: <XCircle className="size-5 text-red-500" />,
    warning: <AlertCircle className="size-5 text-amber-500" />,
    info: <Info className="size-5 text-blue-500" />,
  };

  const backgrounds = {
    success: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    error: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg shadow-md border backdrop-blur-sm animate-in slide-in-from-right-5 duration-300",
        backgrounds[type]
      )}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="flex-1">
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
