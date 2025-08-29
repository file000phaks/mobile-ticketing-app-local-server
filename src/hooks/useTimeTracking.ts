import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { dbHelpers } from '../lib/dbhelper';
import { toast } from '../components/ui/use-toast';

export interface TimeEntry {
  id?: string;
  ticket_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActiveSession {
  ticketId: string;
  startTime: Date;
  description?: string;
}

export interface TimeTrackingState {
  activeSession: ActiveSession | null;
  timeEntries: TimeEntry[];
  loading: boolean;
  error: string | null;
}

export const useTimeTracking = (ticketId?: string) => {

  const { user } = useAuth();
  const [state, setState] = useState<TimeTrackingState>({
    activeSession: null,
    timeEntries: [],
    loading: false,
    error: null
  });

  // Load time entries for a specific ticket
  const loadTimeEntries = useCallback(async (targetTicketId?: string) => {
    if (!user || (!ticketId && !targetTicketId)) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const entries = await dbHelpers.getTimeEntries(targetTicketId || ticketId!);
      setState(prev => ({ 
        ...prev, 
        timeEntries: entries || [], 
        loading: false 
      }));
    } catch (error) {
    
      console.error('Error loading time entries:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: user.id,
        error: error
    
      });
    
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load time entries', 
        loading: false 
      }));
    
    }
  
  }, [user, ticketId]);

  // Start tracking time for a ticket
  const startTracking = useCallback(async (targetTicketId: string, description?: string) => {
   
    if (!user) {
   
      toast({
        title: 'Error',
        description: 'You must be logged in to track time.',
        variant: 'destructive'
      });
   
      return;
   
    }

    // Stop any existing session first
    if (state.activeSession) {
   
      await stopTracking();
   
    }

    const startTime = new Date();
   
    const newSession: ActiveSession = {
      ticketId: targetTicketId,
      startTime,
      description
    };

    setState(prev => ({ ...prev, activeSession: newSession }));

    // Store in localStorage as backup
    localStorage.setItem('activeTimeSession', JSON.stringify({
      ...newSession,
      startTime: startTime.toISOString()
    }));

    toast({
      title: 'Time tracking started',
      description: `Started tracking time for ticket ${targetTicketId.slice(-6)}`,
    });
  }, [user, state.activeSession]);

  // Stop tracking and save entry
  const stopTracking = useCallback(async (description?: string) => {
  
    if (!state.activeSession || !user) return;

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - state.activeSession.startTime.getTime()) / (1000 * 60));

    const timeEntry: Omit<TimeEntry, 'id'> = {
      ticket_id: state.activeSession.ticketId,
      user_id: user.id,
      start_time: state.activeSession.startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: duration,
      description: description || state.activeSession.description || 'Work on ticket'
    };

    setState(prev => ({ ...prev, loading: true }));

    try {
      const savedEntry = await dbHelpers.createTimeEntry(timeEntry);
      
      setState(prev => ({ 
        ...prev, 
        activeSession: null,
        timeEntries: [savedEntry, ...prev.timeEntries],
        loading: false
      }));

      // Clear localStorage
      localStorage.removeItem('activeTimeSession');

      toast({
        title: 'Time tracking stopped',
        description: `Recorded ${duration} minutes of work.`,
      });

      return savedEntry;
    } catch (error) {
      console.error('Error saving time entry:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        entry: entry,
        userId: userId,
        error: error
      });
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to save time entry', 
        loading: false 
      }));
      
      toast({
        title: 'Error',
        description: 'Failed to save time entry. Please try again.',
        variant: 'destructive'
      });
    }
  }, [state.activeSession, user]);

  // Pause tracking (keep session but don't record time)
  const pauseTracking = useCallback(() => {
    if (state.activeSession) {
      setState(prev => ({ ...prev, activeSession: null }));
      localStorage.removeItem('activeTimeSession');
      
      toast({
        title: 'Time tracking paused',
        description: 'Time tracking has been paused. Start again to continue.',
      });
    }
  }, [state.activeSession]);

  // Get total time spent on a ticket
  const getTotalTime = useCallback((targetTicketId?: string) => {
    const entries = state.timeEntries.filter(entry => 
      !targetTicketId || entry.ticket_id === targetTicketId
    );
    
    return entries.reduce((total, entry) => total + (entry.duration_minutes || 0), 0);
  }, [state.timeEntries]);

  // Get current session duration
  const getCurrentSessionDuration = useCallback(() => {
    if (!state.activeSession) return 0;
    
    return Math.round((new Date().getTime() - state.activeSession.startTime.getTime()) / (1000 * 60));
  }, [state.activeSession]);

  // Format duration to human readable string
  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }, []);

  // Update time entry
  const updateTimeEntry = useCallback(async (entryId: string, updates: Partial<TimeEntry>) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const updatedEntry = await dbHelpers.updateTimeEntry(entryId, updates);
      
      setState(prev => ({ 
        ...prev, 
        timeEntries: prev.timeEntries.map(entry => 
          entry.id === entryId ? { ...entry, ...updatedEntry } : entry
        ),
        loading: false
      }));

      toast({
        title: 'Time entry updated',
        description: 'Time entry has been updated successfully.',
      });

      return updatedEntry;
    } catch (error) {
      console.error('Error updating time entry:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        entryId: entryId,
        updates: updates,
        userId: userId,
        error: error
      });
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to update time entry', 
        loading: false 
      }));
      
      toast({
        title: 'Error',
        description: 'Failed to update time entry. Please try again.',
        variant: 'destructive'
      });
    }
  }, []);

  // Delete time entry
  const deleteTimeEntry = useCallback(async (entryId: string) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      await dbHelpers.deleteTimeEntry(entryId);
      
      setState(prev => ({ 
        ...prev, 
        timeEntries: prev.timeEntries.filter(entry => entry.id !== entryId),
        loading: false
      }));

      toast({
        title: 'Time entry deleted',
        description: 'Time entry has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting time entry:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        entryId: entryId,
        userId: userId,
        error: error
      });
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to delete time entry', 
        loading: false 
      }));
      
      toast({
        title: 'Error',
        description: 'Failed to delete time entry. Please try again.',
        variant: 'destructive'
      });
    }
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('activeTimeSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setState(prev => ({ 
          ...prev, 
          activeSession: {
            ...session,
            startTime: new Date(session.startTime)
          }
        }));
      } catch (error) {
        console.error('Error restoring time session:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId: userId,
          error: error
        });
        localStorage.removeItem('activeTimeSession');
      }
    }
  }, []);

  // Load time entries when ticket changes
  useEffect(() => {
    if (ticketId) {
      loadTimeEntries();
    }
  }, [ticketId, loadTimeEntries]);

  return {
    ...state,
    startTracking,
    stopTracking,
    pauseTracking,
    getTotalTime,
    getCurrentSessionDuration,
    formatDuration,
    updateTimeEntry,
    deleteTimeEntry,
    loadTimeEntries,
    isTracking: !!state.activeSession
  };
};

export default useTimeTracking;
