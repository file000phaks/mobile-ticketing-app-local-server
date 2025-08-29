import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff,
  Download,
  Upload,
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useOfflineQueueContext } from './OfflineQueueProvider';
import { cn } from '../lib/utils';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { queueLength, processing, hasFailedActions } = useOfflineQueueContext();
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('excellent');

  useEffect(() => {
    if (isOnline) {
      setLastOnline(new Date());
      // Simple connection quality check
      const checkConnection = async () => {
        try {
          const start = Date.now();
          await fetch('/?ping=' + Math.random(), { method: 'HEAD' });
          const latency = Date.now() - start;
          
          if (latency < 100) setConnectionQuality('excellent');
          else if (latency < 300) setConnectionQuality('good');
          else setConnectionQuality('poor');
        } catch {
          setConnectionQuality('offline');
        }
      };
      
      checkConnection();
      const interval = setInterval(checkConnection, 30000); // Check every 30s
      return () => clearInterval(interval);
    } else {
      setConnectionQuality('offline');
    }
  }, [isOnline]);

  const getConnectionIcon = () => {
    if (!isOnline) return WifiOff;
    switch (connectionQuality) {
      case 'excellent': return Wifi;
      case 'good': return Wifi;
      case 'poor': return Wifi;
      default: return WifiOff;
    }
  };

  const getConnectionColor = () => {
    if (!isOnline) return 'text-red-500';
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      default: return 'text-red-500';
    }
  };

  const formatLastOnline = () => {
    if (!lastOnline) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastOnline.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return lastOnline.toLocaleDateString();
  };

  const ConnectionIcon = getConnectionIcon();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <ConnectionIcon className={cn("w-4 h-4", getConnectionColor())} />
          {(queueLength > 0 || hasFailedActions) && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ConnectionIcon className={cn("w-5 h-5", getConnectionColor())} />
            Connection Status
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isOnline ? `Quality: ${connectionQuality}` : `Last online: ${formatLastOnline()}`}
                  </p>
                </div>
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isOnline ? "bg-green-500" : "bg-red-500"
                )} />
              </div>
            </CardContent>
          </Card>

          {/* Sync Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Data Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {processing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span className="text-sm">Syncing changes...</span>
                  </div>
                  <Progress value={undefined} className="h-2" />
                </div>
              ) : queueLength > 0 ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Pending changes</span>
                  </div>
                  <Badge variant="secondary">{queueLength}</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">All changes synced</span>
                </div>
              )}

              {hasFailedActions && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Some changes failed to sync</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offline Mode Info */}
          {!isOnline && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-orange-600">
                    <CloudOff className="w-4 h-4" />
                    <span className="font-medium">Offline Mode Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You can continue working. Changes will be saved locally and synced when you're back online.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connection Tips */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Connection Tips</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Move to an area with better signal</li>
                  <li>• Check your WiFi or mobile data</li>
                  <li>• Try refreshing the page</li>
                  <li>• Changes are saved locally until you're online</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Network Quality Indicator */}
          {isOnline && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Signal strength:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={cn(
                      "w-1 h-3 rounded-sm",
                      connectionQuality === 'excellent' || 
                      (connectionQuality === 'good' && bar <= 3) ||
                      (connectionQuality === 'poor' && bar <= 2)
                        ? "bg-green-500"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
