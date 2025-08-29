import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import {
  Play,
  Pause,
  Square,
  Clock,
  Timer,
  Edit,
  Trash2,
  Plus,
  Calendar,
  User
} from 'lucide-react';
import { useTimeTracking, TimeEntry } from '../hooks/useTimeTracking';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface TimeTrackerProps {
  ticketId: string;
  className?: string;
  compact?: boolean;
}

export default function TimeTracker({ ticketId, className, compact = false }: TimeTrackerProps) {
  const { user } = useAuth();
  const {
    activeSession,
    timeEntries,
    loading,
    isTracking,
    startTracking,
    stopTracking,
    pauseTracking,
    getTotalTime,
    getCurrentSessionDuration,
    formatDuration,
    updateTimeEntry,
    deleteTimeEntry
  } = useTimeTracking(ticketId);

  const [currentDuration, setCurrentDuration] = useState(0);
  const [description, setDescription] = useState('');
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState('');

  // Update current session duration every minute
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentDuration(getCurrentSessionDuration());
      }, 60000); // Update every minute

      // Initial update
      setCurrentDuration(getCurrentSessionDuration());

      return () => clearInterval(interval);
    }
  }, [isTracking, getCurrentSessionDuration]);

  const handleStart = async () => {
    await startTracking(ticketId, description);
    setDescription('');
  };

  const handleStop = async () => {
    await stopTracking(description);
    setDescription('');
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditDescription(entry.description || '');
    setEditDuration(entry.duration_minutes?.toString() || '');
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    const updates: Partial<TimeEntry> = {
      description: editDescription,
      duration_minutes: parseInt(editDuration) || editingEntry.duration_minutes
    };

    await updateTimeEntry(editingEntry.id!, updates);
    setEditingEntry(null);
    setEditDescription('');
    setEditDuration('');
  };

  const handleDelete = async (entryId: string) => {
    await deleteTimeEntry(entryId);
  };

  const totalTime = getTotalTime(ticketId);
  const sessionTime = isTracking ? currentDuration : 0;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{formatDuration(totalTime + sessionTime)}</span>
        </div>
        
        {isTracking ? (
          <div className="flex items-center gap-1">
            <Badge variant="destructive" className="text-xs animate-pulse">
              <Timer className="w-3 h-3 mr-1" />
              {formatDuration(sessionTime)}
            </Badge>
            <Button size="sm" variant="outline" onClick={handleStop}>
              <Square className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => startTracking(ticketId)}>
            <Play className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Time Tracking
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Total: {formatDuration(totalTime + sessionTime)}
            </Badge>
            {isTracking && (
              <Badge variant="destructive" className="text-sm animate-pulse">
                <Timer className="w-3 h-3 mr-1" />
                {formatDuration(sessionTime)}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Time Control */}
        <div className="space-y-3">
          {!isTracking ? (
            <div className="space-y-2">
              <Label htmlFor="description">Work Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
              />
              <Button onClick={handleStart} disabled={loading} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Start Tracking
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Currently tracking</p>
                    <p className="text-xs text-muted-foreground">
                      {activeSession?.description || 'Working on ticket'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatDuration(sessionTime)}</p>
                    <p className="text-xs text-muted-foreground">
                      Started {activeSession?.startTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleStop} disabled={loading} className="flex-1">
                  <Square className="w-4 h-4 mr-2" />
                  Stop & Save
                </Button>
                <Button variant="outline" onClick={pauseTracking} disabled={loading}>
                  <Pause className="w-4 h-4" />
                </Button>
              </div>
              
              {!loading && (
                <div className="space-y-2">
                  <Label htmlFor="stop-description">Add Description (Optional)</Label>
                  <Input
                    id="stop-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you accomplished"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Time Entries */}
        {timeEntries.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Time Entries</h4>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Manual Entry
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Manual Time Entry</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="manual-duration">Duration (minutes)</Label>
                      <Input
                        id="manual-duration"
                        type="number"
                        placeholder="60"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual-description">Description</Label>
                      <Textarea
                        id="manual-description"
                        placeholder="Describe the work performed"
                      />
                    </div>
                    <Button className="w-full">
                      Add Entry
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-2">
              {timeEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatDuration(entry.duration_minutes || 0)}
                      </span>
                      <Calendar className="w-3 h-3 text-muted-foreground ml-2" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.start_time).toLocaleDateString()}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this time entry? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(entry.id!)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              
              {timeEntries.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... and {timeEntries.length - 5} more entries
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-duration">Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe the work performed"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} disabled={loading} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditingEntry(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
