import React, { createContext, useContext } from 'react';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  Upload, 
  WifiOff, 
  AlertCircle,
  X,
  RotateCcw
} from 'lucide-react';

interface OfflineQueueContextType {
  addToQueue: (action: any) => string;
  queueLength: number;
  processing: boolean;
  hasFailedActions: boolean;
}

const OfflineQueueContext = createContext<OfflineQueueContextType | null>(null);

export const useOfflineQueueContext = () => {
  const context = useContext(OfflineQueueContext);
  if (!context) {
    throw new Error('useOfflineQueueContext must be used within OfflineQueueProvider');
  }
  return context;
};

interface OfflineQueueProviderProps {
  children: React.ReactNode;
}

export default function OfflineQueueProvider({ children }: OfflineQueueProviderProps) {
  const { 
    addToQueue, 
    queueLength, 
    processing, 
    hasFailedActions,
    processQueue,
    clearQueue
  } = useOfflineQueue();
  const isOnline = useOnlineStatus();

  const contextValue: OfflineQueueContextType = {
    addToQueue,
    queueLength,
    processing,
    hasFailedActions
  };

  const [showQueueStatus, setShowQueueStatus] = React.useState(false);

  // Show queue status when there are queued items or when offline
  React.useEffect(() => {
    setShowQueueStatus(queueLength > 0 || !isOnline);
  }, [queueLength, isOnline]);

  return (
    <OfflineQueueContext.Provider value={contextValue}>
      {children}
      
      {/* Offline Queue Status Indicator */}
      {showQueueStatus && (
        <div className="fixed bottom-20 left-4 right-4 z-50 flex justify-center">
          <Card className="bg-card/95 backdrop-blur-sm shadow-lg border-2 max-w-sm w-full">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {!isOnline ? (
                    <WifiOff className="w-4 h-4 text-orange-500" />
                  ) : processing ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : hasFailedActions ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Upload className="w-4 h-4 text-blue-500" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {!isOnline ? 'Offline Mode' : 
                         processing ? 'Syncing...' :
                         hasFailedActions ? 'Sync Failed' :
                         'Queued Actions'}
                      </span>
                      {queueLength > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {queueLength}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {!isOnline ? 'Changes will sync when online' :
                       processing ? 'Uploading your changes...' :
                       hasFailedActions ? 'Some actions failed to sync' :
                       'Pending sync to server'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {isOnline && queueLength > 0 && !processing && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={processQueue}
                      className="h-8 px-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowQueueStatus(false)}
                    className="h-8 px-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {hasFailedActions && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={processQueue}
                      className="flex-1 h-7 text-xs"
                    >
                      Retry Failed
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearQueue}
                      className="flex-1 h-7 text-xs text-destructive hover:text-destructive"
                    >
                      Clear Queue
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </OfflineQueueContext.Provider>
  );
}
