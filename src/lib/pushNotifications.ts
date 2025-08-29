// Push Notifications Service for Field Engineer Portal
// Implements service worker based notifications with proper permission handling

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = false;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  // Initialize the service
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
      
      // Request permission if not already granted
      if (this.permission === 'default') {
        await this.requestPermission();
      }

      return this.permission === 'granted';
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) return 'denied';

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Show a local notification
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted or not supported');
      return;
    }

    if (!this.registration) {
      console.error('Service worker not registered');
      return;
    }

    try {
      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/icon.svg',
        badge: payload.badge || '/icon.svg',
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction || false,
        silent: false,
        vibrate: [200, 100, 200], // Vibration pattern for mobile
        timestamp: Date.now()
      };

      await this.registration.showNotification(payload.title, options);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Show ticket-related notifications
  async showTicketNotification(type: 'assigned' | 'updated' | 'completed' | 'overdue', ticketData: any): Promise<void> {
    const notifications = {
      assigned: {
        title: 'New Ticket Assigned',
        body: `You have been assigned ticket: ${ticketData.title}`,
        tag: `ticket-assigned-${ticketData.id}`,
        data: { type: 'ticket_assigned', ticketId: ticketData.id },
        actions: [
          { action: 'view', title: 'View Ticket' },
          { action: 'accept', title: 'Accept' }
        ],
        requireInteraction: true
      },
      updated: {
        title: 'Ticket Updated',
        body: `Ticket "${ticketData.title}" has been updated`,
        tag: `ticket-updated-${ticketData.id}`,
        data: { type: 'ticket_updated', ticketId: ticketData.id },
        actions: [
          { action: 'view', title: 'View Changes' }
        ]
      },
      completed: {
        title: 'Ticket Completed',
        body: `Ticket "${ticketData.title}" has been marked as completed`,
        tag: `ticket-completed-${ticketData.id}`,
        data: { type: 'ticket_completed', ticketId: ticketData.id },
        actions: [
          { action: 'view', title: 'View Ticket' },
          { action: 'verify', title: 'Verify' }
        ]
      },
      overdue: {
        title: 'Ticket Overdue',
        body: `Ticket "${ticketData.title}" is past its due date`,
        tag: `ticket-overdue-${ticketData.id}`,
        data: { type: 'ticket_overdue', ticketId: ticketData.id },
        actions: [
          { action: 'view', title: 'View Ticket' },
          { action: 'update', title: 'Update Status' }
        ],
        requireInteraction: true
      }
    };

    const notification = notifications[type];
    if (notification) {
      await this.showNotification(notification);
    }
  }

  // Show system notifications
  async showSystemNotification(type: 'maintenance' | 'emergency' | 'update', message: string): Promise<void> {
    const notifications = {
      maintenance: {
        title: 'System Maintenance',
        body: message,
        tag: 'system-maintenance',
        data: { type: 'system_maintenance' },
        requireInteraction: true
      },
      emergency: {
        title: 'Emergency Alert',
        body: message,
        tag: 'emergency-alert',
        data: { type: 'emergency' },
        requireInteraction: true,
        actions: [
          { action: 'acknowledge', title: 'Acknowledge' }
        ]
      },
      update: {
        title: 'App Update Available',
        body: message,
        tag: 'app-update',
        data: { type: 'app_update' },
        actions: [
          { action: 'update', title: 'Update Now' },
          { action: 'later', title: 'Later' }
        ]
      }
    };

    const notification = notifications[type];
    if (notification) {
      await this.showNotification(notification);
    }
  }

  // Schedule notification for later
  async scheduleNotification(payload: NotificationPayload, delay: number): Promise<void> {
    setTimeout(() => {
      this.showNotification(payload);
    }, delay);
  }

  // Clear notifications with specific tag
  async clearNotifications(tag?: string): Promise<void> {
    if (!this.registration) return;

    try {
      const notifications = await this.registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  // Check if notifications are supported
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // Handle notification click events
  handleNotificationClick(event: NotificationEvent): void {
    const notification = event.notification;
    const data = notification.data;

    notification.close();

    // Handle different notification types
    switch (data?.type) {
      case 'ticket_assigned':
      case 'ticket_updated':
      case 'ticket_completed':
      case 'ticket_overdue':
        // Navigate to ticket detail page
        event.waitUntil(
          clients.openWindow(`/tickets/${data.ticketId}`)
        );
        break;
      
      case 'system_maintenance':
      case 'emergency':
        // Navigate to dashboard
        event.waitUntil(
          clients.openWindow('/')
        );
        break;
      
      case 'app_update':
        if (event.action === 'update') {
          // Trigger app update
          event.waitUntil(
            clients.openWindow('/update')
          );
        }
        break;
    }
  }

  // Handle notification action click events
  handleNotificationAction(event: NotificationEvent): void {
    const action = event.action;
    const data = event.notification.data;

    event.notification.close();

    switch (action) {
      case 'view':
        event.waitUntil(
          clients.openWindow(`/tickets/${data.ticketId}`)
        );
        break;
      
      case 'accept':
        // Handle ticket acceptance
        event.waitUntil(
          fetch(`/api/tickets/${data.ticketId}/accept`, { method: 'POST' })
        );
        break;
      
      case 'verify':
        // Handle ticket verification
        event.waitUntil(
          clients.openWindow(`/tickets/${data.ticketId}?action=verify`)
        );
        break;
      
      case 'acknowledge':
        // Handle emergency acknowledgment
        event.waitUntil(
          fetch('/api/emergency/acknowledge', { method: 'POST' })
        );
        break;
    }
  }
}

// Create and export singleton instance
export const pushNotificationService = new PushNotificationService();

// Auto-initialize on import
pushNotificationService.initialize().catch(console.error);

export default pushNotificationService;
