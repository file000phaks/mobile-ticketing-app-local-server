/**
 * @fileoverview Hook for managing resolved tickets and ticket history
 * @author Field Engineer Portal Team
 */

import { useState, useEffect, useCallback } from 'react';
import { ResolvedTicketsService, ResolvedTicketStats, ResolvedTicketFilters } from '../services/ResolvedTicketsService';
import { useAuth } from './useAuth';
import { envLog } from '../config/environment';
import { toast } from '../components/ui/use-toast';

/**
 * Hook for managing resolved tickets
 * @returns {Object} Resolved tickets management functions and state
 */
export function useResolvedTickets() {
  
  const { user, profile } = useAuth();
  const [resolvedTickets, setResolvedTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<ResolvedTicketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  /**
   * Loads resolved tickets with optional filters
   * @param {ResolvedTicketFilters} [filters] - Optional filters
   */
  const loadResolvedTickets = useCallback(async (filters: ResolvedTicketFilters = {}) => {
    
    if (!user) return;

    try {
     
      setLoading(true);
      setError(null);

      // If user is field engineer, only show their tickets
      const userFilters = { ...filters };
     
      if (profile?.role === 'field_engineer') {
     
        userFilters.createdBy = user.id;
        // Also include tickets they resolved or were assigned to
        // This would need a more complex query in the service
     
      }

      const { tickets, total } = await ResolvedTicketsService.getResolvedTickets(userFilters);
      
      setResolvedTickets(tickets);
      setTotalCount(total);
      
      envLog('log', `Loaded ${tickets.length} resolved tickets`);
    
    } catch (error) {
    
      const errorMessage = error instanceof Error ? error.message : 'Failed to load resolved tickets';
    
      setError(errorMessage);
      envLog('error', 'Error loading resolved tickets:', error);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
    
      setLoading(false);
    
    }
  
  }, [user, profile]);

  /**
   * Loads resolved ticket statistics
   * @param {string} [userId] - Optional user ID to filter stats
   */
  const loadStats = useCallback(async (userId?: string) => {
   
    try {
   
      setLoading(true);
      
      // If user is field engineer, only show their stats
      const filterUserId = profile?.role === 'field_engineer' ? user?.id : userId;
      
      const ticketStats = await ResolvedTicketsService.getResolvedTicketStats(filterUserId);
      setStats(ticketStats);
      
      envLog('log', 'Loaded resolved ticket statistics');
   
    } catch (error) {
   
      const errorMessage = error instanceof Error ? error.message : 'Failed to load statistics';
      setError(errorMessage);
      envLog('error', 'Error loading resolved ticket stats:', error);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
     
      setLoading(false);
    
    }
  
  }, [user, profile]);

  /**
   * Resolves a ticket and moves it to resolved status
   * @param {string} ticketId - ID of ticket to resolve
   * @param {string} [resolutionNotes] - Optional resolution notes
   */
  const resolveTicket = useCallback(async (ticketId: string, resolutionNotes?: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      
      const resolvedTicket = await ResolvedTicketsService.resolveTicket(
        ticketId, 
        user.id, 
        resolutionNotes
      );
      
      toast({
        title: 'Ticket Resolved',
        description: 'The ticket has been marked as resolved and archived.',
      });
      
      envLog('log', `Ticket ${ticketId} resolved successfully`);
      
      // Refresh data
      await loadResolvedTickets();
      await loadStats();
      
      return resolvedTicket;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve ticket';
      envLog('error', 'Error resolving ticket:', error);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, loadResolvedTickets, loadStats]);

  /**
   * Exports resolved tickets to CSV
   * @param {ResolvedTicketFilters} [filters] - Optional filters
   * @returns {Promise<void>}
   */
  const exportToCSV = useCallback(async (filters: ResolvedTicketFilters = {}) => {
    try {
      setLoading(true);
      
      const csvContent = await ResolvedTicketsService.exportToCSV(filters);
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `resolved-tickets-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Complete',
        description: 'Resolved tickets have been exported to CSV.',
      });
      
      envLog('log', 'Resolved tickets exported to CSV');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export tickets';
      envLog('error', 'Error exporting resolved tickets:', error);
      
      toast({
        title: 'Export Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cleans up old resolved tickets (admin only)
   * @param {Date} olderThan - Delete tickets resolved before this date
   */
  const cleanupOldTickets = useCallback(async (olderThan: Date) => {
    if (profile?.role !== 'admin') {
      throw new Error('Only administrators can cleanup old tickets');
    }

    try {
      setLoading(true);
      
      const deletedCount = await ResolvedTicketsService.cleanupOldResolvedTickets(olderThan);
      
      toast({
        title: 'Cleanup Complete',
        description: `${deletedCount} old resolved tickets have been deleted.`,
      });
      
      envLog('log', `Cleaned up ${deletedCount} old resolved tickets`);
      
      // Refresh data
      await loadResolvedTickets();
      await loadStats();
      
      return deletedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup old tickets';
      envLog('error', 'Error cleaning up old tickets:', error);
      
      toast({
        title: 'Cleanup Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [profile, loadResolvedTickets, loadStats]);

  /**
   * Searches resolved tickets by text
   * @param {string} searchTerm - Search term
   * @param {ResolvedTicketFilters} [additionalFilters] - Additional filters
   */
  const searchResolvedTickets = useCallback(async (
    searchTerm: string, 
    additionalFilters: ResolvedTicketFilters = {}
  ) => {
    
    // For now, we'll load all tickets and filter client-side
    // In a production app, you'd want server-side search
    await loadResolvedTickets(additionalFilters);
    
    if (!searchTerm.trim()) return;
    
    const filtered = resolvedTickets.filter(ticket => 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.resolution_notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setResolvedTickets(filtered);
    setTotalCount(filtered.length);

  }, [loadResolvedTickets, resolvedTickets]);

  // Load initial data when user changes
  useEffect(() => {
    if (user && profile) {
      loadResolvedTickets();
      loadStats();
    } else {
      setResolvedTickets([]);
      setStats(null);
      setTotalCount(0);
    }
  }, [user, profile, loadResolvedTickets, loadStats]);

  // Check if user can view resolved tickets
  const canViewResolvedTickets = profile?.role === 'admin' || profile?.role === 'supervisor' || profile?.role === 'field_engineer';
  
  // Check if user can manage resolved tickets (resolve tickets)
  const canManageResolvedTickets = profile?.role === 'admin' || profile?.role === 'supervisor';
  
  // Check if user can cleanup old tickets
  const canCleanupTickets = profile?.role === 'admin';

  return {
    resolvedTickets,
    stats,
    loading,
    error,
    totalCount,
    loadResolvedTickets,
    loadStats,
    resolveTicket,
    exportToCSV,
    cleanupOldTickets,
    searchResolvedTickets,
    canViewResolvedTickets,
    canManageResolvedTickets,
    canCleanupTickets
  };
}

/**
 * Hook for resolved ticket statistics only (lighter weight)
 * @param {string} [userId] - Optional user ID to filter stats
 * @returns {Object} Resolved ticket statistics
 */
export function useResolvedTicketStats(userId?: string) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<ResolvedTicketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // If user is field engineer, only show their stats
      const filterUserId = profile?.role === 'field_engineer' ? user.id : userId;
      
      const ticketStats = await ResolvedTicketsService.getResolvedTicketStats(filterUserId);
      setStats(ticketStats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load statistics';
      setError(errorMessage);
      envLog('error', 'Error loading resolved ticket stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile, userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: loadStats
  };
}
