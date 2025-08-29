/**
 * @fileoverview Notification system hook for managing real-time notifications
 * @author Field Engineer Portal Team
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../backend/supabase/supabase-interface';
import { notificationService, Notification, NotificationFactory } from '../models/Notification';
import { UserProfile } from '../models/User';
import { Ticket } from '../models/Ticket';
import { useAuth } from './useAuth';
import { config, envLog } from '../config/environment';
import { dbHelpers as db } from '../lib/dbhelper';

/**
 * Hook for managing notification system
 * @returns {Object} Notification system functions and state
 */
export function useNotificationSystem() {
  
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * Loads notifications for the current user
   */
  const loadNotifications = useCallback(async () => {
  
    if (!user) return;

    try {
  
      setLoading(true);
      
      if (supabase) {
       
        // Load from Supabase
        const { data, error } = await db.getUserNotifications(user.id)

        if (error) throw error;

        const dbNotifications = data.map(record => Notification.fromDatabaseRecord(record));

        setNotifications(dbNotifications);

        setUnreadCount(dbNotifications.filter(n => !n.isRead).length);

      } else {

        // Load from in-memory service
        const userNotifications = notificationService.getNotificationsForUser(user.id);
        setNotifications(userNotifications);
        setUnreadCount(notificationService.getUnreadCount(user.id));

      }

    } catch (error) {

      envLog('error', 'Error loading notifications:', error);

    } finally {

      setLoading(false);

    }

  }, [user]);

  /**
   * Marks a notification as read
   * @param {string} notificationId - ID of the notification to mark as read
   */

  const markAsRead = useCallback(async (notificationId: string) => {
   
    try {
   
      if (supabase) {
   
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', notificationId);

        if (error) throw error;
   
      } else {
   
        notificationService.markAsRead(notificationId);
   
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() } as Notification
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      envLog('error', 'Error marking notification as read:', error);
    }
  }, []);

  /**
   * Marks all notifications as read for the current user
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      if (supabase) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (error) throw error;
      } else {
        notificationService.markAllAsRead(user.id);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() } as Notification))
      );
      setUnreadCount(0);
    } catch (error) {
      envLog('error', 'Error marking all notifications as read:', error);
    }
  }, [user]);

  /**
   * Creates and sends notification when a ticket is created
   * @param {Ticket} ticket - The created ticket
   */
  const notifyTicketCreated = useCallback(async (ticket: Ticket) => {
    try {
      // Get all supervisors and admins to notify
      const { data: supervisors, error } = supabase 
        ? await supabase
            .from('user_profiles')
            .select('*')
            .in('role', ['admin', 'supervisor'])
            .eq('is_active', true)
        : { data: [], error: null };

      if (error && supabase) {
        throw error;
      }

      const supervisorUsers = supervisors || [];

      // Create notifications for each supervisor
      for (const supervisor of supervisorUsers) {
        const notification = NotificationFactory.createTicketCreatedNotification(ticket, supervisor.id);
        
        if (supabase) {
          // Save to database
          const { error: insertError } = await supabase
            .from('notifications')
            .insert({
              id: notification.id,
              user_id: notification.userId,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              priority: notification.priority,
              ticket_id: notification.ticketId,
              triggered_by: notification.triggeredBy,
              metadata: notification.metadata,
              created_at: notification.createdAt.toISOString()
            });

          if (insertError) throw insertError;
        } else {
          // Add to in-memory service
          notificationService.addNotification(notification);
        }
      }

      envLog('log', `Created ${supervisorUsers.length} notifications for ticket creation: ${ticket.title}`);
    } catch (error) {
      envLog('error', 'Error creating ticket creation notifications:', error);
    }
  }, []);

  /**
   * Creates and sends notification when a ticket is resolved
   * @param {Ticket} ticket - The resolved ticket
   * @param {string} resolvedByUserId - ID of user who resolved the ticket
   */
  const notifyTicketResolved = useCallback(async (ticket: Ticket, resolvedByUserId: string) => {
    try {
      const notification = NotificationFactory.createTicketResolvedNotification(ticket, resolvedByUserId);
      
      if (supabase) {
        // Save to database
        const { error } = await supabase
          .from('notifications')
          .insert({
            id: notification.id,
            user_id: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            ticket_id: notification.ticketId,
            triggered_by: notification.triggeredBy,
            metadata: notification.metadata,
            created_at: notification.createdAt.toISOString()
          });

        if (error) throw error;
      } else {
        // Add to in-memory service
        notificationService.addNotification(notification);
      }

      envLog('log', `Created notification for ticket resolution: ${ticket.title}`);
    } catch (error) {
      envLog('error', 'Error creating ticket resolution notification:', error);
    }
  }, []);

  /**
   * Creates and sends notification when a ticket is assigned
   * @param {Ticket} ticket - The assigned ticket
   * @param {string} assignedUserId - ID of assigned user
   * @param {string} assignedByUserId - ID of user who made assignment
   */
  const notifyTicketAssigned = useCallback(async (ticket: Ticket, assignedUserId: string, assignedByUserId: string) => {
    try {
      const notification = NotificationFactory.createTicketAssignedNotification(ticket, assignedUserId, assignedByUserId);
      
      if (supabase) {
        // Save to database
        const { error } = await supabase
          .from('notifications')
          .insert({
            id: notification.id,
            user_id: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            ticket_id: notification.ticketId,
            triggered_by: notification.triggeredBy,
            metadata: notification.metadata,
            created_at: notification.createdAt.toISOString()
          });

        if (error) throw error;
      } else {
        // Add to in-memory service
        notificationService.addNotification(notification);
      }

      envLog('log', `Created notification for ticket assignment: ${ticket.title}`);
    } catch (error) {
      envLog('error', 'Error creating ticket assignment notification:', error);
    }
  }, []);

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, loadNotifications]);

  // Set up real-time subscription if Supabase is available
  useEffect(() => {
    if (!user || !supabase) return;

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = Notification.fromDatabaseRecord(payload.new);
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    notifyTicketCreated,
    notifyTicketResolved,
    notifyTicketAssigned
  };
}
