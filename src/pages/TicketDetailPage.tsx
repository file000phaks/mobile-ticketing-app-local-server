import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  MessageSquare,
  Trash2,
  Send,
  Calendar,
  AlertTriangle,
  Settings,
  CheckCircle,
  Wrench,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from '../components/ui/use-toast';
import TicketAssignment from '../components/TicketAssignment';
import SubTicketCreator from '../components/SubTicketCreator';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, updateTicketStatus, addNote, getTicketActivities, deleteTicket } = useTickets();
  const { isAdmin } = useUserRole();

  const [ newNote, setNewNote ] = useState( '' );
  const [ newStatus, setNewStatus ] = useState( '' );
  const [ loading, setLoading ] = useState( false );
  const [ activities, setActivities ] = useState<any[]>( [] );
  const [ ticketsLoading, setTicketsLoading ] = useState( true );

  const ticket = tickets.find( t => t.id === id );

  // Load activities when ticket is found
  React.useEffect( () => {

    if ( ticket ) getTicketActivities( ticket.id ).then( setActivities );

  }, [ ticket, getTicketActivities ] );

  // Monitor tickets loading state
  React.useEffect( () => {

    if ( tickets.length > 0 || user ) setTicketsLoading( false );

  }, [ tickets, user ] );

  // Show loading state while tickets are being loaded
  if ( ticketsLoading && !ticket ) {

    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <Card className="p-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
          <h2 className="text-lg font-medium mb-2">Loading ticket...</h2>
          <p className="text-muted-foreground">
            Please wait while we fetch the ticket details.
          </p>
        </Card>
      </div>
    );

  }

  // Show not found only after tickets have loaded
  if ( !ticketsLoading && !ticket ) {

    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <Card className="p-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            ��
          </div>
          <h2 className="text-lg font-medium mb-2">Ticket not found</h2>
          <p className="text-muted-foreground mb-4">
            The ticket you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate( '/tickets' )}>
            Back to Tickets
          </Button>
        </Card>
      </div>
    );

  }

  const handleAddNote = async () => {

    if ( !newNote.trim() ) return;

    setLoading( true );

    try {

      await addNote( ticket.id, newNote );

      setNewNote( '' );

    } finally {

      setLoading( false );

    }

  };

  const handleStatusUpdate = async () => {

    if ( !newStatus || newStatus === ticket.status ) return;

    setLoading( true );

    try {

      await updateTicketStatus( ticket.id, newStatus as any );

      setNewStatus( '' );

    } finally {

      setLoading( false );

    }

  };

  const getPriorityColor = ( priority: string ) => {

    switch ( priority ) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }

  };

  const getStatusColor = ( status: string ) => {

    switch ( status ) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'verified': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }

  };

  const getStatusIcon = ( status: string ) => {

    switch ( status ) {
      case 'open': return Clock;
      case 'in_progress': return Wrench;
      case 'resolved': case 'verified': case 'closed': return CheckCircle;
      default: return Clock;
    }

  };

  const handleDeleteTicket = async () => {

    if ( !ticket ) return;

    try {

      setLoading( true );
      await deleteTicket( ticket.id );
      navigate( '/tickets' );

    } catch ( error ) {

      console.error( 'Error deleting ticket:', {
        message: error instanceof Error ? error.message : String( error ),
        stack: error instanceof Error ? error.stack : undefined,
        ticketId: id,
        component: 'TicketDetailPage',
        error: error
      } );
    } finally {

      setLoading( false );

    }

  };

  const canUpdateStatus = isAdmin ||
    ( ticket.createdByProfile?.email === user?.email ) ||
    ( ticket.assignedToProfile?.email === user?.email ); // Allow assigned engineer to update

  const canWithdraw = !isAdmin && ticket.status === 'open' && ticket.createdByProfile?.email === user?.email;

  const isAssignedEngineer = ticket.assignedToProfile?.email === user?.email;

  const StatusIcon = getStatusIcon( ticket.status );

  return (

    <div className="max-w-4xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6 pb-20">

      {/* Header */}

      <div className="flex items-center justify-between">

        <Button variant="ghost" size="sm" onClick={() => navigate( '/tickets' )}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {isAdmin && (

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
                <AlertDialogAction onClick={handleDeleteTicket} disabled={loading}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Ticket Overview */}
      <Card className={cn(
        "border-l-4",
        ticket.priority === 'critical' && "border-l-red-500",
        ticket.priority === 'high' && "border-l-orange-500",
        ticket.priority === 'medium' && "border-l-yellow-500",
        ticket.priority === 'low' && "border-l-green-500"
      )}>

        <CardHeader className="pb-3">

          <div className="flex justify-between items-start gap-2">

            <CardTitle className="text-lg leading-tight">{ticket.title}</CardTitle>

            <div className="flex gap-1 flex-shrink-0">

              <Badge className={cn( "text-xs", getPriorityColor( ticket.priority ) )}>
                {ticket.priority === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {ticket.priority}
              </Badge>

              <Badge className={cn( "text-xs", getStatusColor( ticket.status ) )}>

                <StatusIcon className="w-3 h-3 mr-1" />
                {ticket.status.replace( '_', ' ' )}
                
              </Badge>

            </div>

          </div>

        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{ticket.description}</p>

          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span><strong>Location:</strong> {ticket.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span><strong>Created:</strong> {new Date( ticket.createdAt ).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span><strong>Reported by:</strong> {ticket.createdByProfile?.fullName || ticket.createdByProfile?.email || 'Unknown'}</span>
            </div>
            {ticket.assignedToProfile && (
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span><strong>Assigned to:</strong> {ticket.assignedToProfile.fullName}</span>
              </div>
            )}
            {ticket.equipment && (
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span><strong>Equipment:</strong> {ticket.equipment.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Update */}
      {( canUpdateStatus || canWithdraw ) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {isAdmin ? 'Update Status' : 'Actions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canUpdateStatus && (
              <div className="flex gap-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={`Current: ${ticket.status.replace( '_', ' ' )}`} />
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
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || newStatus === ticket.status || loading}
                >
                  Update
                </Button>
              </div>
            )}

            {/* Sub-ticket creation for assigned engineers */}
            {isAssignedEngineer && ticket.status === 'in_progress' && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Issues During Maintenance?</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a sub-ticket for unexpected problems
                    </p>
                  </div>
                  <SubTicketCreator
                    parentTicketId={ticket.id}
                    parentTicketTitle={ticket.title}
                    onSubTicketCreated={() => {
                      toast( {
                        title: 'Sub-ticket created',
                        description: 'The issue has been reported as a sub-ticket.'
                      } );
                    }}
                  />
                </div>
              </div>
            )}

            {canWithdraw && (
              <Button
                variant="outline"
                onClick={() => updateTicketStatus( ticket.id, 'closed' )}
                className="w-full"
                disabled={loading}
              >
                Withdraw Ticket
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ticket Assignment (Admin/Supervisor only) */}
      {( isAdmin || user?.email?.includes( 'supervisor' ) ) && (
        <TicketAssignment
          ticketId={ticket.id}
          currentAssignee={ticket.assignedTo}
          ticketLocation={ticket.location}
          onAssigned={() => {
            // Refresh activities and ticket data
            if ( ticket ) {
              getTicketActivities( ticket.id ).then( setActivities );
            }
          }}
        />
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No activity yet</p>
              ) : (
                activities.map( ( activity ) => (

                  <div key={activity.id} className="border-l-2 border-muted pl-4 pb-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          by {activity.performedBy}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date( activity.createdAt ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) )
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Note */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Add Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={newNote}
            onChange={( e ) => setNewNote( e.target.value )}
            placeholder="Add a note or update..."
            rows={3}
            className="resize-none"
          />
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || loading}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
