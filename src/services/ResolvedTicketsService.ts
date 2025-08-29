/**
 * @fileoverview Service for managing resolved tickets and ticket history
 * @author Field Engineer Portal Team
 */

import { dbHelpers } from '../lib/dbhelper';
import { Ticket } from '../models/Ticket';
import { UserProfile } from '../models/User';
import { envLog, config } from '../config/environment';

/**
 * Interface for resolved ticket statistics
 */
export interface ResolvedTicketStats {
  totalResolved: number;
  avgResolutionTime: number;
  resolvedThisMonth: number;
  resolvedThisWeek: number;
  resolutionTrends: {
    month: string;
    count: number;
    avgTime: number;
  }[];
  topResolvers: {
    userId: string;
    userProfile: UserProfile;
    count: number;
    avgTime: number;
  }[];
}

/**
 * Interface for resolved ticket filters
 */
export interface ResolvedTicketFilters {
  startDate?: Date;
  endDate?: Date;
  resolvedBy?: string;
  createdBy?: string;
  priority?: string[];
  type?: string[];
  department?: string;
  limit?: number;
  offset?: number;
}

/**
 * Service class for managing resolved tickets
 * @class ResolvedTicketsService
 */
export class ResolvedTicketsService {
  /**
   * Moves a ticket to resolved status and archives it
   * @param {string} ticketId - ID of the ticket to resolve
   * @param {string} resolvedByUserId - ID of user resolving the ticket
   * @param {string} [resolutionNotes] - Optional resolution notes
   * @returns {Promise<Ticket>} The updated ticket
   */
  static async resolveTicket(
    ticketId: string, 
    resolvedByUserId: string, 
    resolutionNotes?: string
  ): Promise<Ticket> {
    if (!supabase) {
      throw new Error('Supabase not configured - cannot resolve tickets');
    }

    try {
      const now = new Date().toISOString();
      
      // Update ticket status to resolved
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .update({
          status: 'resolved',
          resolved_at: now,
          resolved_by: resolvedByUserId,
          notes: resolutionNotes || null,
          updated_at: now
        })
        .eq('id', ticketId)
        .select(`
          *,
          equipment(*),
          created_by_profile:user_profiles!tickets_created_by_fkey(*),
          assigned_to_profile:user_profiles!tickets_assigned_to_fkey(*),
          resolved_by_profile:user_profiles!tickets_resolved_by_fkey(*)
        `)
        .single();

      if (ticketError) throw ticketError;

      // Create resolved ticket record for archival
      const { error: archiveError } = await supabase
        .from('resolved_tickets')
        .insert({
          ticket_id: ticketId,
          original_created_at: ticketData.created_at,
          resolved_at: now,
          resolved_by: resolvedByUserId,
          created_by: ticketData.created_by,
          assigned_to: ticketData.assigned_to,
          title: ticketData.title,
          description: ticketData.description,
          type: ticketData.type,
          priority: ticketData.priority,
          location: ticketData.location,
          equipment_id: ticketData.equipment_id,
          resolution_time_hours: ResolvedTicketsService.calculateResolutionTime(
            new Date(ticketData.created_at),
            new Date(now)
          ),
          resolution_notes: resolutionNotes,
          final_status: 'resolved'
        });

      if (archiveError) {
        envLog('warn', 'Failed to archive resolved ticket:', archiveError);
        // Don't fail the resolution if archiving fails
      }

      // Log activity
      await supabase
        .from('ticket_activities')
        .insert({
          ticket_id: ticketId,
          user_id: resolvedByUserId,
          type: 'status_change',
          description: `Ticket resolved${resolutionNotes ? `: ${resolutionNotes}` : ''}`,
          created_at: now
        });

      envLog('log', `Ticket ${ticketId} resolved and archived successfully`);
      
      return Ticket.fromDatabaseRecord(ticketData);
    } catch (error) {
      envLog('error', 'Error resolving ticket:', error);
      throw error;
    }
  }

  /**
   * Gets resolved tickets with filtering and pagination
   * @param {ResolvedTicketFilters} [filters] - Optional filters
   * @returns {Promise<{tickets: Ticket[], total: number}>} Resolved tickets and total count
   */
  static async getResolvedTickets(
    filters: ResolvedTicketFilters = {}
  ): Promise<{tickets: any[], total: number}> {
    if (!supabase) {
      throw new Error('Supabase not configured - cannot fetch resolved tickets');
    }

    try {
      let query = supabase
        .from('resolved_tickets')
        .select(`
          *,
          ticket:tickets(*),
          created_by_profile:user_profiles!resolved_tickets_created_by_fkey(*),
          assigned_to_profile:user_profiles!resolved_tickets_assigned_to_fkey(*),
          resolved_by_profile:user_profiles!resolved_tickets_resolved_by_fkey(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters.startDate) {
        query = query.gte('resolved_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('resolved_at', filters.endDate.toISOString());
      }
      if (filters.resolvedBy) {
        query = query.eq('resolved_by', filters.resolvedBy);
      }
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      if (filters.priority) {
        query = query.in('priority', filters.priority);
      }
      if (filters.type) {
        query = query.in('type', filters.type);
      }

      // Apply pagination
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      } else if (filters.limit) {
        query = query.limit(filters.limit);
      }

      // Order by resolution date (newest first)
      query = query.order('resolved_at', { ascending: false });

      const { data, error, count } = await query;
      
      if (error) throw error;

      return {
        tickets: data || [],
        total: count || 0
      };
    } catch (error) {
      envLog('error', 'Error fetching resolved tickets:', error);
      throw error;
    }
  }

  /**
   * Gets resolved ticket statistics
   * @param {string} [userId] - Optional user ID to filter stats
   * @returns {Promise<ResolvedTicketStats>} Resolved ticket statistics
   */
  static async getResolvedTicketStats(userId?: string): Promise<ResolvedTicketStats> {
    if (!supabase) {
      throw new Error('Supabase not configured - cannot fetch stats');
    }

    try {
      // Base query for resolved tickets
      let baseQuery = supabase.from('resolved_tickets').select('*');
      if (userId) {
        baseQuery = baseQuery.eq('resolved_by', userId);
      }

      // Get total resolved count
      const { count: totalResolved, error: countError } = await baseQuery;
      if (countError) throw countError;

      // Get tickets resolved this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      let monthQuery = supabase.from('resolved_tickets').select('*');
      if (userId) monthQuery = monthQuery.eq('resolved_by', userId);
      const { count: resolvedThisMonth, error: monthError } = await monthQuery
        .gte('resolved_at', thisMonth.toISOString());
      if (monthError) throw monthError;

      // Get tickets resolved this week
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
      thisWeek.setHours(0, 0, 0, 0);
      
      let weekQuery = supabase.from('resolved_tickets').select('*');
      if (userId) weekQuery = weekQuery.eq('resolved_by', userId);
      const { count: resolvedThisWeek, error: weekError } = await weekQuery
        .gte('resolved_at', thisWeek.toISOString());
      if (weekError) throw weekError;

      // Get average resolution time
      let avgQuery = supabase.from('resolved_tickets').select('resolution_time_hours');
      if (userId) avgQuery = avgQuery.eq('resolved_by', userId);
      const { data: resolutionTimes, error: avgError } = await avgQuery;
      if (avgError) throw avgError;

      const avgResolutionTime = resolutionTimes && resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, r) => sum + (r.resolution_time_hours || 0), 0) / resolutionTimes.length
        : 0;

      // Get monthly trends (last 6 months)
      const resolutionTrends = await ResolvedTicketsService.getMonthlyTrends(userId);

      // Get top resolvers (if not filtering by user)
      const topResolvers = userId ? [] : await ResolvedTicketsService.getTopResolvers();

      return {
        totalResolved: totalResolved || 0,
        avgResolutionTime,
        resolvedThisMonth: resolvedThisMonth || 0,
        resolvedThisWeek: resolvedThisWeek || 0,
        resolutionTrends,
        topResolvers
      };
    } catch (error) {
      envLog('error', 'Error fetching resolved ticket stats:', error);
      throw error;
    }
  }

  /**
   * Gets monthly resolution trends
   * @private
   * @param {string} [userId] - Optional user ID filter
   * @returns {Promise<Array>} Monthly trends data
   */
  private static async getMonthlyTrends(userId?: string): Promise<any[]> {
    if (!supabase) return [];

    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      let query = supabase
        .from('resolved_tickets')
        .select('resolved_at, resolution_time_hours')
        .gte('resolved_at', sixMonthsAgo.toISOString());
      
      if (userId) {
        query = query.eq('resolved_by', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by month
      const monthlyData: Record<string, { count: number; totalTime: number }> = {};
      
      data?.forEach(ticket => {
        const date = new Date(ticket.resolved_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { count: 0, totalTime: 0 };
        }
        
        monthlyData[monthKey].count++;
        monthlyData[monthKey].totalTime += ticket.resolution_time_hours || 0;
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        count: data.count,
        avgTime: data.count > 0 ? data.totalTime / data.count : 0
      })).sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      envLog('error', 'Error getting monthly trends:', error);
      return [];
    }
  }

  /**
   * Gets top ticket resolvers
   * @private
   * @returns {Promise<Array>} Top resolvers data
   */
  private static async getTopResolvers(): Promise<any[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .rpc('get_top_resolvers', { limit_count: 10 });

      if (error) {
        // Fallback if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('resolved_tickets')
          .select(`
            resolved_by,
            resolution_time_hours,
            resolved_by_profile:user_profiles!resolved_tickets_resolved_by_fkey(*)
          `);

        if (fallbackError) throw fallbackError;

        // Group and calculate manually
        const resolverStats: Record<string, any> = {};
        fallbackData?.forEach(ticket => {
          const userId = ticket.resolved_by;
          if (!resolverStats[userId]) {
            resolverStats[userId] = {
              userId,
              userProfile: ticket.resolved_by_profile,
              count: 0,
              totalTime: 0
            };
          }
          resolverStats[userId].count++;
          resolverStats[userId].totalTime += ticket.resolution_time_hours || 0;
        });

        return Object.values(resolverStats)
          .map((stats: any) => ({
            ...stats,
            avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }

      return data || [];
    } catch (error) {
      envLog('error', 'Error getting top resolvers:', error);
      return [];
    }
  }

  /**
   * Calculates resolution time in hours
   * @private
   * @param {Date} createdAt - Ticket creation date
   * @param {Date} resolvedAt - Ticket resolution date
   * @returns {number} Resolution time in hours
   */
  private static calculateResolutionTime(createdAt: Date, resolvedAt: Date): number {
    const diffMs = resolvedAt.getTime() - createdAt.getTime();
    return Math.round(diffMs / (1000 * 60 * 60) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Permanently deletes old resolved tickets (for cleanup)
   * @param {Date} olderThan - Delete tickets resolved before this date
   * @returns {Promise<number>} Number of tickets deleted
   */
  static async cleanupOldResolvedTickets(olderThan: Date): Promise<number> {
    if (!supabase) {
      throw new Error('Supabase not configured - cannot cleanup tickets');
    }

    try {
      const { data, error } = await supabase
        .from('resolved_tickets')
        .delete()
        .lt('resolved_at', olderThan.toISOString())
        .select('id');

      if (error) throw error;

      const deletedCount = data?.length || 0;
      envLog('log', `Cleaned up ${deletedCount} old resolved tickets`);
      
      return deletedCount;
    } catch (error) {
      envLog('error', 'Error cleaning up old resolved tickets:', error);
      throw error;
    }
  }

  /**
   * Exports resolved tickets to CSV format
   * @param {ResolvedTicketFilters} [filters] - Optional filters
   * @returns {Promise<string>} CSV content
   */
  static async exportToCSV(filters: ResolvedTicketFilters = {}): Promise<string> {
    const { tickets } = await ResolvedTicketsService.getResolvedTickets(filters);
    
    // CSV headers
    const headers = [
      'Ticket ID',
      'Title',
      'Type',
      'Priority',
      'Created By',
      'Assigned To',
      'Resolved By',
      'Location',
      'Created At',
      'Resolved At',
      'Resolution Time (hours)',
      'Resolution Notes'
    ];

    // CSV rows
    const rows = tickets.map(ticket => [
      ticket.ticket_id,
      `"${ticket.title.replace(/"/g, '""')}"`,
      ticket.type,
      ticket.priority,
      ticket.created_by_profile?.full_name || ticket.created_by_profile?.email || 'Unknown',
      ticket.assigned_to_profile?.full_name || ticket.assigned_to_profile?.email || 'Unassigned',
      ticket.resolved_by_profile?.full_name || ticket.resolved_by_profile?.email || 'Unknown',
      `"${ticket.location.replace(/"/g, '""')}"`,
      new Date(ticket.original_created_at).toLocaleDateString(),
      new Date(ticket.resolved_at).toLocaleDateString(),
      ticket.resolution_time_hours || 0,
      `"${(ticket.resolution_notes || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}
