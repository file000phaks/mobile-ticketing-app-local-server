import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Clock, MapPin, User, MessageSquare, Trash2 } from 'lucide-react';
import { Ticket } from '../models/Ticket';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface TicketDetailProps {
  ticket: Ticket;
  onUpdate: (ticketId: string, updates: any) => void;
  onDelete?: (ticketId: string) => void;
  onBack: () => void;
  isAdmin: boolean;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
};

const TicketDetail: React.FC<TicketDetailProps> = ({ 
  ticket, 
  onUpdate, 
  onDelete,
  onBack, 
  isAdmin
}) => {
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState(ticket.status);

  const handleAddNote = () => {
    if (newNote.trim()) {
      onUpdate(ticket.id, { 
        notes: [...(ticket.notes || []), {
          id: Date.now().toString(),
          content: newNote,
          createdAt: new Date().toISOString(),
          createdBy: 'Current User'
        }]
      });
      setNewNote('');
    }
  };

  const handleStatusUpdate = () => {
    if (newStatus !== ticket.status) {
      onUpdate(ticket.id, { status: newStatus });
    }
  };

  const canUpdateStatus = isAdmin || (ticket.status !== 'resolved' && ticket.status !== 'closed');
  const canWithdraw = !isAdmin && ticket.status === 'open';

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-bold">Ticket Details</h1>
        </div>
        {isAdmin && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this ticket? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(ticket.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg flex-1">{ticket.title}</CardTitle>
            <div className="flex gap-2">
              <Badge className={priorityColors[ticket.priority]}>
                {ticket.priority}
              </Badge>
              <Badge className={statusColors[ticket.status]}>
                {ticket.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{ticket.description}</p>
          
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span><strong>Location:</strong> {ticket.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span><strong>Reported by:</strong> {ticket.createdByProfile.fullName || 'Unknown'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {(canUpdateStatus || canWithdraw) && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">
              {isAdmin ? 'Update Status' : 'Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canUpdateStatus && (
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="flex-1 input-enhanced">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    {isAdmin && (
                      <>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <Button onClick={handleStatusUpdate} disabled={newStatus === ticket.status}>
                  Update
                </Button>
              </div>
            )}
            {canWithdraw && (
              <Button 
                variant="outline" 
                onClick={() => onUpdate(ticket.id, { status: 'closed' })}
                className="w-full"
              >
                Withdraw Ticket
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Add Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note or update..."
            rows={3}
            className="input-enhanced"
          />
          <Button onClick={handleAddNote} disabled={!newNote.trim()} className="w-full">
            Add Note
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDetail;