import { useState, useEffect } from 'react';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/ui/use-toast';

interface Notification {
  id: string;
  type: 'ticket_assigned' | 'status_change' | 'urgent_ticket' | 'system';
  title: string;
  message: string;
  ticketId?: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

const NOTIFICATIONS_STORAGE_KEY = 'app_notifications';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { tickets } = useTickets();
  const { user } = useAuth();

  // Load notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsedNotifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(parsedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        hook: 'useNotifications',
        operation: 'loadNotifications',
        error: error
      });
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        notificationsCount: notifications.length,
        hook: 'useNotifications',
        operation: 'saveNotifications',
        error: error
      });
    }
  }, [notifications]);

  // Monitor tickets for changes that should trigger notifications
  useEffect(() => {
    if (!user) return;

    // Check for critical/urgent tickets assigned to user
    const userTickets = tickets.filter(ticket => 
      ticket.assignedTo === user.email && 
      (ticket.priority === 'critical' || ticket.priority === 'high') &&
      ticket.status === 'open'
    );

    userTickets.forEach(ticket => {
      const existingNotification = notifications.find(n => 
        n.ticketId === ticket.id && n.type === 'urgent_ticket'
      );

      if (!existingNotification) {
        addNotification({
          type: 'urgent_ticket',
          title: `${ticket.priority === 'critical' ? '🚨 Critical' : '⚠️ High Priority'} Ticket Assigned`,
          message: `${ticket.title} - ${ticket.location}`,
          ticketId: ticket.id,
          priority: ticket.priority === 'critical' ? 'high' : 'medium'
        });
      }
    });

    // Check for tickets assigned to user (new assignments)
    const recentlyAssigned = tickets.filter(ticket => 
      ticket.assignedTo === user.email &&
      ticket.status === 'open' &&
      new Date(ticket.updatedAt).getTime() > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    );

    recentlyAssigned.forEach(ticket => {
      const existingNotification = notifications.find(n => 
        n.ticketId === ticket.id && n.type === 'ticket_assigned'
      );

      if (!existingNotification) {
        addNotification({
          type: 'ticket_assigned',
          title: 'New Ticket Assigned',
          message: `You've been assigned: ${ticket.title}`,
          ticketId: ticket.id,
          priority: 'medium'
        });
      }
    });
  }, [tickets, user, notifications]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only 50 most recent

    // Show toast for high priority notifications
    if (notification.priority === 'high') {
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000
      });
    }

    return newNotification.id;
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Trigger system notifications
  const showSystemNotification = (title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    addNotification({
      type: 'system',
      title,
      message,
      priority
    });
  };

  // Request notification permissions
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showSystemNotification(
          'Notifications Enabled',
          'You\'ll now receive notifications for important updates',
          'low'
        );
        return true;
      }
    }
    return false;
  };

  // Send browser notification for critical alerts
  const sendBrowserNotification = (title: string, message: string, ticketId?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: ticketId || 'general',
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        if (ticketId) {
          // Navigate to ticket (would need router context)
          window.location.hash = `#/tickets/${ticketId}`;
        }
        notification.close();
      };
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => !n.read && n.priority === 'high').length;

  return {
    notifications,
    unreadCount,
    urgentCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    showSystemNotification,
    requestNotificationPermission,
    sendBrowserNotification
  };
};
