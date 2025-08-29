/**
 * @fileoverview Notification model and system for the Field Engineer Portal application
 * @author Field Engineer Portal Team
 */

import { UserProfile } from './User';
import { Ticket } from './Ticket';

/**
 * Represents notification types
 * @typedef {'ticket_created'|'ticket_assigned'|'ticket_resolved'|'ticket_commented'|'ticket_overdue'|'system'} NotificationType
 */
export type NotificationType = 'ticket_created' | 'ticket_assigned' | 'ticket_resolved' | 'ticket_commented' | 'ticket_overdue' | 'system';

/**
 * Represents notification priority levels
 * @typedef {'low'|'medium'|'high'|'urgent'} NotificationPriority
 */
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Represents a notification in the system
 * @class Notification
 */
export class Notification {
  /** @type {string} Unique identifier for the notification */
  public readonly id: string;

  /** @type {string} ID of the user who should receive the notification */
  public readonly userId: string;

  /** @type {NotificationType} Type of notification */
  public readonly type: NotificationType;

  /** @type {string} Notification title */
  public title: string;

  /** @type {string} Notification message content */
  public message: string;

  /** @type {NotificationPriority} Priority level */
  public priority: NotificationPriority;

  /** @type {boolean} Whether the notification has been read */
  public isRead: boolean;

  /** @type {string|null} Related ticket ID (if applicable) */
  public ticketId: string | null;

  /** @type {string|null} ID of user who triggered the notification */
  public triggeredBy: string | null;

  /** @type {Object|null} Additional data related to the notification */
  public metadata: Record<string, any> | null;

  /** @type {Date} When the notification was created */
  public readonly createdAt: Date;

  /** @type {Date|null} When the notification was read */
  public readAt: Date | null;

  /** @type {Date|null} When the notification expires */
  public expiresAt: Date | null;

  /**
   * Creates a new Notification instance
   * @param {Object} notificationData - The notification data object
   */
  constructor(notificationData: {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority: NotificationPriority;
    isRead?: boolean;
    ticketId?: string | null;
    triggeredBy?: string | null;
    metadata?: Record<string, any> | null;
    createdAt: Date;
    readAt?: Date | null;
    expiresAt?: Date | null;
  }) {
    this.id = notificationData.id;
    this.userId = notificationData.userId;
    this.type = notificationData.type;
    this.title = notificationData.title;
    this.message = notificationData.message;
    this.priority = notificationData.priority;
    this.isRead = notificationData.isRead || false;
    this.ticketId = notificationData.ticketId || null;
    this.triggeredBy = notificationData.triggeredBy || null;
    this.metadata = notificationData.metadata || null;
    this.createdAt = notificationData.createdAt;
    this.readAt = notificationData.readAt || null;
    this.expiresAt = notificationData.expiresAt || null;
  }

  /**
   * Marks the notification as read
   */
  public markAsRead(): void {
    if (!this.isRead) {
      this.isRead = true;
      this.readAt = new Date();
    }
  }

  /**
   * Marks the notification as unread
   */
  public markAsUnread(): void {
    if (this.isRead) {
      this.isRead = false;
      this.readAt = null;
    }
  }

  /**
   * Checks if the notification is expired
   * @returns {boolean} True if notification is expired
   */
  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Checks if the notification is urgent
   * @returns {boolean} True if notification is urgent priority
   */
  public isUrgent(): boolean {
    return this.priority === 'urgent';
  }

  /**
   * Gets the age of the notification in minutes
   * @returns {number} Age in minutes
   */
  public getAgeInMinutes(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60));
  }

  /**
   * Gets a human-readable relative time string
   * @returns {string} Relative time (e.g., "5 minutes ago")
   */
  public getRelativeTime(): string {
    const ageMinutes = this.getAgeInMinutes();
    
    if (ageMinutes < 1) return 'Just now';
    if (ageMinutes < 60) return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
    
    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours < 24) return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
    
    const ageDays = Math.floor(ageHours / 24);
    if (ageDays < 7) return `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
    
    const ageWeeks = Math.floor(ageDays / 7);
    return `${ageWeeks} week${ageWeeks > 1 ? 's' : ''} ago`;
  }

  /**
   * Converts the notification to a plain object
   * @returns {Object} Plain object representation
   */
  public toJSON(): object {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      priority: this.priority,
      isRead: this.isRead,
      ticketId: this.ticketId,
      triggeredBy: this.triggeredBy,
      metadata: this.metadata,
      createdAt: this.createdAt,
      readAt: this.readAt,
      expiresAt: this.expiresAt
    };
  }

  /**
   * Creates a Notification instance from a database record
   * @param {any} record - Database record
   * @returns {Notification} Notification instance
   */
  public static fromDatabaseRecord(record: any): Notification {
    return new Notification({
      id: record.id,
      userId: record.user_id,
      type: record.type,
      title: record.title,
      message: record.message,
      priority: record.priority,
      isRead: record.is_read,
      ticketId: record.ticket_id,
      triggeredBy: record.triggered_by,
      metadata: record.metadata,
      createdAt: new Date(record.created_at),
      readAt: record.read_at ? new Date(record.read_at) : null,
      expiresAt: record.expires_at ? new Date(record.expires_at) : null
    });
  }
}

/**
 * Factory class for creating notifications
 * @class NotificationFactory
 */
export class NotificationFactory {
  /**
   * Creates a ticket creation notification for supervisors
   * @param {Ticket} ticket - The created ticket
   * @param {string} supervisorId - ID of supervisor to notify
   * @returns {Notification} Notification instance
   */
  public static createTicketCreatedNotification(ticket: Ticket, supervisorId: string): Notification {
    return new Notification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: supervisorId,
      type: 'ticket_created',
      title: 'New Ticket Created',
      message: `A new ${ticket.priority} priority ticket "${ticket.title}" has been created at ${ticket.location}`,
      priority: ticket.isCritical() ? 'urgent' : ticket.isHighPriority() ? 'high' : 'medium',
      ticketId: ticket.id,
      triggeredBy: ticket.createdBy,
      createdAt: new Date(),
      metadata: {
        ticketNumber: ticket.ticketNumber,
        location: ticket.location,
        type: ticket.type
      }
    });
  }

  /**
   * Creates a ticket assignment notification
   * @param {Ticket} ticket - The assigned ticket
   * @param {string} assignedUserId - ID of user assigned to ticket
   * @param {string} assignedByUserId - ID of user who made the assignment
   * @returns {Notification} Notification instance
   */
  public static createTicketAssignedNotification(
    ticket: Ticket, 
    assignedUserId: string, 
    assignedByUserId: string
  ): Notification {
    return new Notification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: assignedUserId,
      type: 'ticket_assigned',
      title: 'Ticket Assigned to You',
      message: `You have been assigned to ticket "${ticket.title}" (${ticket.ticketNumber})`,
      priority: ticket.isCritical() ? 'urgent' : ticket.isHighPriority() ? 'high' : 'medium',
      ticketId: ticket.id,
      triggeredBy: assignedByUserId,
      createdAt: new Date(),
      metadata: {
        ticketNumber: ticket.ticketNumber,
        location: ticket.location,
        priority: ticket.priority,
        dueDate: ticket.dueDate
      }
    });
  }

  /**
   * Creates a ticket resolution notification for the creator
   * @param {Ticket} ticket - The resolved ticket
   * @param {string} resolvedByUserId - ID of user who resolved the ticket
   * @returns {Notification} Notification instance
   */
  public static createTicketResolvedNotification(
    ticket: Ticket, 
    resolvedByUserId: string
  ): Notification {
    return new Notification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: ticket.createdBy,
      type: 'ticket_resolved',
      title: 'Your Ticket Has Been Resolved',
      message: `Ticket "${ticket.title}" (${ticket.ticketNumber}) has been marked as resolved`,
      priority: 'medium',
      ticketId: ticket.id,
      triggeredBy: resolvedByUserId,
      createdAt: new Date(),
      metadata: {
        ticketNumber: ticket.ticketNumber,
        resolvedAt: ticket.resolvedAt,
        location: ticket.location
      }
    });
  }

  /**
   * Creates a ticket comment notification
   * @param {Ticket} ticket - The ticket with new comment
   * @param {string} commentByUserId - ID of user who added comment
   * @param {string} comment - The comment text
   * @param {string[]} notifyUserIds - IDs of users to notify
   * @returns {Notification[]} Array of notification instances
   */
  public static createTicketCommentedNotifications(
    ticket: Ticket, 
    commentByUserId: string, 
    comment: string, 
    notifyUserIds: string[]
  ): Notification[] {
    return notifyUserIds
      .filter(userId => userId !== commentByUserId) // Don't notify the commenter
      .map(userId => new Notification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'ticket_commented',
        title: 'New Comment on Ticket',
        message: `New comment added to ticket "${ticket.title}" (${ticket.ticketNumber})`,
        priority: 'low',
        ticketId: ticket.id,
        triggeredBy: commentByUserId,
        createdAt: new Date(),
        metadata: {
          ticketNumber: ticket.ticketNumber,
          comment: comment.length > 100 ? comment.substring(0, 100) + '...' : comment
        }
      }));
  }

  /**
   * Creates an overdue ticket notification
   * @param {Ticket} ticket - The overdue ticket
   * @param {string[]} notifyUserIds - IDs of users to notify
   * @returns {Notification[]} Array of notification instances
   */
  public static createTicketOverdueNotifications(
    ticket: Ticket, 
    notifyUserIds: string[]
  ): Notification[] {
    return notifyUserIds.map(userId => new Notification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'ticket_overdue',
      title: 'Ticket Overdue',
      message: `Ticket "${ticket.title}" (${ticket.ticketNumber}) is overdue`,
      priority: 'high',
      ticketId: ticket.id,
      triggeredBy: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire after 24 hours
      metadata: {
        ticketNumber: ticket.ticketNumber,
        dueDate: ticket.dueDate,
        hoursOverdue: ticket.getHoursUntilDue() ? Math.abs(ticket.getHoursUntilDue()!) : 0
      }
    }));
  }

  /**
   * Creates a system notification
   * @param {string} userId - ID of user to notify
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {NotificationPriority} priority - Notification priority
   * @param {Record<string, any>} [metadata] - Additional metadata
   * @returns {Notification} Notification instance
   */
  public static createSystemNotification(
    userId: string,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    metadata?: Record<string, any>
  ): Notification {
    return new Notification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'system',
      title,
      message,
      priority,
      createdAt: new Date(),
      metadata: metadata || null
    });
  }
}

/**
 * Service class for managing notifications
 * @class NotificationService
 */
export class NotificationService {
  
  /** @type {Notification[]} In-memory notification store */
  private notifications: Notification[] = [];

  /** @type {Function[]} Event listeners for notification events */
  private listeners: Array<(notification: Notification) => void> = [];

  /**
   * Adds a notification to the system
   * @param {Notification} notification - Notification to add
   */
  public addNotification(notification: Notification): void {
   
    this.notifications.push(notification);
    this.notifyListeners(notification);
  
  }

  /**
   * Gets notifications for a specific user
   * @param {string} userId - User ID
   * @param {Object} [options] - Query options
   * @param {boolean} [options.unreadOnly] - Only return unread notifications
   * @param {number} [options.limit] - Maximum number of notifications to return
   * @param {NotificationType[]} [options.types] - Filter by notification types
   * @returns {Notification[]} Array of notifications
   */
  public getNotificationsForUser(
    userId: string, 
    options: {
      unreadOnly?: boolean;
      limit?: number;
      types?: NotificationType[];
    } = {}
  ): Notification[] {
   
    let userNotifications = this.notifications
      .filter(notif => notif.userId === userId && !notif.isExpired())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options.unreadOnly) {
      userNotifications = userNotifications.filter(notif => !notif.isRead);
    }

    if (options.types) {
      userNotifications = userNotifications.filter(notif => options.types!.includes(notif.type));
    }

    if (options.limit) {
      userNotifications = userNotifications.slice(0, options.limit);
    }

    return userNotifications;
  }

  /**
   * Gets the count of unread notifications for a user
   * @param {string} userId - User ID
   * @returns {number} Count of unread notifications
   */
  public getUnreadCount(userId: string): number {
    return this.notifications.filter(
      notif => notif.userId === userId && !notif.isRead && !notif.isExpired()
    ).length;
  }

  /**
   * Marks a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {boolean} True if notification was found and marked as read
   */
  public markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(notif => notif.id === notificationId);
    if (notification) {
      notification.markAsRead();
      return true;
    }
    return false;
  }

  /**
   * Marks all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {number} Number of notifications marked as read
   */
  public markAllAsRead(userId: string): number {
    let count = 0;
    this.notifications
      .filter(notif => notif.userId === userId && !notif.isRead)
      .forEach(notif => {
        notif.markAsRead();
        count++;
      });
    return count;
  }

  /**
   * Removes expired notifications
   * @returns {number} Number of notifications removed
   */
  public cleanupExpiredNotifications(): number {
    const initialCount = this.notifications.length;
    this.notifications = this.notifications.filter(notif => !notif.isExpired());
    return initialCount - this.notifications.length;
  }

  /**
   * Adds an event listener for new notifications
   * @param {Function} listener - Listener function
   */
  public addListener(listener: (notification: Notification) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Removes an event listener
   * @param {Function} listener - Listener function to remove
   */
  public removeListener(listener: (notification: Notification) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifies all listeners of a new notification
   * @private
   * @param {Notification} notification - New notification
   */
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Creates and sends notifications when a ticket is created
   * @param {Ticket} ticket - The created ticket
   * @param {UserProfile[]} supervisors - List of supervisors to notify
   */
  public async notifyTicketCreated(ticket: Ticket, supervisors: UserProfile[]): Promise<void> {
    for (const supervisor of supervisors) {
      const notification = NotificationFactory.createTicketCreatedNotification(ticket, supervisor.id);
      this.addNotification(notification);
    }
  }

  /**
   * Creates and sends notification when a ticket is assigned
   * @param {Ticket} ticket - The assigned ticket
   * @param {string} assignedUserId - ID of assigned user
   * @param {string} assignedByUserId - ID of user who made assignment
   */
  public async notifyTicketAssigned(
    ticket: Ticket, 
    assignedUserId: string, 
    assignedByUserId: string
  ): Promise<void> {
    const notification = NotificationFactory.createTicketAssignedNotification(
      ticket, 
      assignedUserId, 
      assignedByUserId
    );
    this.addNotification(notification);
  }

  /**
   * Creates and sends notification when a ticket is resolved
   * @param {Ticket} ticket - The resolved ticket
   * @param {string} resolvedByUserId - ID of user who resolved ticket
   */
  public async notifyTicketResolved(ticket: Ticket, resolvedByUserId: string): Promise<void> {
    const notification = NotificationFactory.createTicketResolvedNotification(ticket, resolvedByUserId);
    this.addNotification(notification);
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();
