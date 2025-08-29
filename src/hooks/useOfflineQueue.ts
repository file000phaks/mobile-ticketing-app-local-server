import { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { toast } from '../components/ui/use-toast';

interface QueuedAction {
  id: string;
  type: 'create_ticket' | 'update_ticket' | 'add_note' | 'status_change';
  payload: any;
  timestamp: Date;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'offline_queue';
const MAX_RETRIES = 3;

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [processing, setProcessing] = useState(false);
  const isOnline = useOnlineStatus();

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsedQueue = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setQueue(parsedQueue);
      }
    } catch (error) {
      console.error('Error loading offline queue:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        hook: 'useOfflineQueue',
        operation: 'loadQueue',
        error: error
      });
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        queueLength: queue.length,
        hook: 'useOfflineQueue',
        operation: 'saveQueue',
        error: error
      });
    }
  }, [queue]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !processing) {
      processQueue();
    }
  }, [isOnline, queue.length]);

  const addToQueue = (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    };

    setQueue(prev => [...prev, queuedAction]);
    
    toast({
      title: 'Action Queued',
      description: 'Your action will be synced when you\'re back online.',
      duration: 3000
    });

    return queuedAction.id;
  };

  const removeFromQueue = (actionId: string) => {
    setQueue(prev => prev.filter(action => action.id !== actionId));
  };

  const processQueue = async () => {
    if (processing || !isOnline || queue.length === 0) return;

    setProcessing(true);
    const toastId = toast({
      title: 'Syncing Changes',
      description: `Processing ${queue.length} queued action(s)...`,
      duration: 0
    });

    let processedCount = 0;
    let failedCount = 0;

    for (const action of [...queue]) {
      try {
        // Mock API call - in a real app, you'd call your actual API
        await mockApiCall(action);
        removeFromQueue(action.id);
        processedCount++;
      } catch (error) {
        console.error('Failed to process queued action:', error);
        
        // Increment retry count
        setQueue(prev => prev.map(item => 
          item.id === action.id 
            ? { ...item, retryCount: item.retryCount + 1 }
            : item
        ));

        // Remove if max retries exceeded
        if (action.retryCount >= MAX_RETRIES) {
          removeFromQueue(action.id);
          failedCount++;
        }
      }
    }

    setProcessing(false);
    
    // Dismiss the syncing toast
    toast({
      title: 'Sync Complete',
      description: `${processedCount} action(s) synced successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      duration: 3000
    });
  };

  const clearQueue = () => {
    setQueue([]);
    toast({
      title: 'Queue Cleared',
      description: 'All queued actions have been removed.',
      duration: 2000
    });
  };

  // Mock API call function
  const mockApiCall = async (action: QueuedAction): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Simulate 10% failure rate for testing
    if (Math.random() < 0.1) {
      throw new Error('Mock API failure');
    }
    
    console.log('Processed queued action:', action.type, action.payload);
  };

  return {
    queue,
    queueLength: queue.length,
    processing,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearQueue,
    hasFailedActions: queue.some(action => action.retryCount >= MAX_RETRIES)
  };
};
