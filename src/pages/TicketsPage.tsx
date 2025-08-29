import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../hooks/useAuth';
import { dbHelpers as db } from "../lib/dbhelper";
import { UserProfile } from '../models/User';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Search,
  Filter,
  SortAsc,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  MapPin,
  User,
  Calendar,
  Plus,
  Eye,
  MoreHorizontal,
  UserPlus
} from 'lucide-react';
import { Ticket } from '../models/Ticket';
import { cn } from '../lib/utils';

export default function TicketsPage() {

  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { tickets, loading, assignTicket } = useTickets();
  const [ searchParams, setSearchParams ] = useSearchParams();
  const [ engineers, setEngineers ] = useState<UserProfile[]>( [] );

  const [ searchTerm, setSearchTerm ] = useState( searchParams.get( 'search' ) || '' );
  const [ statusFilter, setStatusFilter ] = useState( searchParams.get( 'status' ) || 'all' );
  const [ priorityFilter, setPriorityFilter ] = useState( searchParams.get( 'priority' ) || 'all' );
  const [ assignedFilter, setAssignedFilter ] = useState( searchParams.get( 'assignedTo' ) || 'all' );
  const [ sortBy, setSortBy ] = useState<'created' | 'updated' | 'priority' | 'due_date'>( 'created' );

  const isAdmin = profile?.role === 'admin';
  const isSupervisor = profile?.role === 'supervisor';
  const isFieldEngineer = profile?.role === 'field_engineer';
  const canViewAllTickets = isAdmin || isSupervisor;

  useEffect( () => {

    // Load engineers for admin/supervisor filters
    if ( canViewAllTickets ) loadEngineers();

  }, [ canViewAllTickets ] );

  useEffect( () => {

    // Update URL parameters when filters change
    const params = new URLSearchParams();

    if ( searchTerm ) params.set( 'search', searchTerm );
    if ( statusFilter !== 'all' ) params.set( 'status', statusFilter );
    if ( priorityFilter !== 'all' ) params.set( 'priority', priorityFilter );
    if ( assignedFilter !== 'all' ) params.set( 'assignedTo', assignedFilter );

    setSearchParams( params );

  }, [ searchTerm, statusFilter, priorityFilter, assignedFilter, setSearchParams ] );

  const loadEngineers = async () => {

    try {

      let engineersData: UserProfile[];

      try {

        engineersData = await db.getUsers( 'field_engineer' );

      } catch ( error ) {

        console.log( "Failed to load engineers", error );

      }

      setEngineers( engineersData || [] );

    } catch ( error ) {

      console.error( 'Error loading engineers:', {
        message: error instanceof Error ? error.message : String( error ),
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      } );

    }

  };

  // Filter tickets based on user role
  const getFilteredTickets = () => {

    let userTickets: Ticket[] = [];

    if ( canViewAllTickets ) {
      // Admin and supervisors see all tickets
      userTickets = tickets;

    } else {

      // Field engineers only see their own tickets (created or assigned)
      userTickets = tickets.filter( ticket =>
        ticket.createdBy === user?.id || ticket.assignedTo === user?.id
      );

    }

    return userTickets.filter( ticket => {

      const matchesSearch = ticket.title.toLowerCase().includes( searchTerm.toLowerCase() ) ||
        ticket.description.toLowerCase().includes( searchTerm.toLowerCase() ) ||
        ticket.location.toLowerCase().includes( searchTerm.toLowerCase() );

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

      const matchesAssigned = assignedFilter === 'all' ||
        ( assignedFilter === 'unassigned' && !ticket.assignedTo ) ||
        ticket.assignedTo === assignedFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssigned;

    } );

  };

  const filteredTickets = getFilteredTickets();

  // Sort tickets
  const sortedTickets = [ ...filteredTickets ].sort( ( a, b ) => {

    switch ( sortBy ) {

      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return ( priorityOrder[ b.priority ] || 0 ) - ( priorityOrder[ a.priority ] || 0 );

      case 'updated':
        return new Date( b.updatedAt ).getTime() - new Date( a.updatedAt ).getTime();

      case 'due_date':

        if ( !a.dueDate && !b.dueDate ) return 0;
        if ( !a.dueDate ) return 1;
        if ( !b.dueDate ) return -1;

        return new Date( a.dueDate ).getTime() - new Date( b.dueDate ).getTime();

      case 'created':

      default:
        return new Date( b.createdAt ).getTime() - new Date( a.createdAt ).getTime();
    }
  } );

  // Get ticket counts for tabs
  const getTicketCounts = () => {
    const allUserTickets = canViewAllTickets ? tickets : tickets.filter( ticket =>
      ticket.createdBy === user?.id || ticket.assignedTo === user?.id
    );

    return {
      all: allUserTickets.length,
      assigned: allUserTickets.filter( t => t.assignedTo === user?.id ).length,
      created: allUserTickets.filter( t => t.createdBy === user?.id ).length,
      unassigned: canViewAllTickets ? allUserTickets.filter( t => !t.assignedTo ).length : 0,
      overdue: allUserTickets.filter( t =>
        t.dueDate &&
        new Date( t.dueDate ) < new Date() &&
        ![ 'resolved', 'verified', 'closed' ].includes( t.status )
      ).length
    };
  };

  const counts = getTicketCounts();

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
      case 'assigned': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'verified': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = ( status: string ) => {
    switch ( status ) {
      case 'open': return Clock;
      case 'assigned': return UserPlus;
      case 'in_progress': return Wrench;
      case 'resolved': case 'verified': case 'closed': return CheckCircle;
      default: return Clock;
    }
  };

  const handleTabChange = ( value: string ) => {
    switch ( value ) {
      case 'all':
        setStatusFilter( 'all' );
        setAssignedFilter( 'all' );
        break;
      case 'assigned':
        setAssignedFilter( user?.id || '' );
        setStatusFilter( 'all' );
        break;
      case 'created':
        setAssignedFilter( 'all' );
        setStatusFilter( 'all' );
        // This would need additional filtering logic based on createdBy
        break;
      case 'unassigned':
        setAssignedFilter( 'unassigned' );
        setStatusFilter( 'all' );
        break;
      case 'overdue':
        setAssignedFilter( 'all' );
        setStatusFilter( 'all' );
        // This would need additional filtering logic for overdue
        break;
    }
  };

  if ( loading ) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          {[ ...Array( 5 ) ].map( ( _, i ) => (
            <Card key={i} className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </Card>
          ) )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Tickets</h1>
            <p className="text-muted-foreground">
              {canViewAllTickets ? 'All system tickets' : 'Your tickets and assignments'}
            </p>
          </div>
          <Button onClick={() => navigate( '/create' )}>
            <Plus className="w-4 h-4 mr-2" />
            Create Ticket
          </Button>
        </div>

        {/* Ticket Tabs */}
        <Tabs defaultValue="all" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="text-xs">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="text-xs">
              Assigned ({counts.assigned})
            </TabsTrigger>
            <TabsTrigger value="created" className="text-xs">
              Created ({counts.created})
            </TabsTrigger>
            {canViewAllTickets && (
              <TabsTrigger value="unassigned" className="text-xs">
                Unassigned ({counts.unassigned})
              </TabsTrigger>
            )}
            <TabsTrigger value="overdue" className="text-xs">
              Overdue ({counts.overdue})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={( e ) => setSearchTerm( e.target.value )}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  {canViewAllTickets && (
                    <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assigned</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {engineers.map( ( engineer ) => (
                          <SelectItem key={engineer.id} value={engineer.id}>
                            {engineer.fullName || engineer.email}
                          </SelectItem>
                        ) )}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="text-xs">
                      <SortAsc className="w-3 h-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Created Date</SelectItem>
                      <SelectItem value="updated">Updated Date</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="due_date">Due Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="text-sm text-muted-foreground">
              Showing {sortedTickets.length} of {filteredTickets.length} tickets
            </div>

            {/* Tickets List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sortedTickets.length === 0 ? (
                <div className="col-span-full">
                  <Card className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                      📋
                    </div>
                    <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Create your first ticket to get started'
                      }
                    </p>
                    <Button onClick={() => navigate( '/create' )}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Ticket
                    </Button>
                  </Card>
                </div>
              ) : (
                sortedTickets.map( ( ticket ) => {
                  const StatusIcon = getStatusIcon( ticket.status );
                  const isPriority = ticket.priority === 'critical' || ticket.priority === 'high';
                  const isOverdue = ticket.dueDate &&
                    new Date( ticket.dueDate ) < new Date() &&
                    ![ 'resolved', 'verified', 'closed' ].includes( ticket.status );

                  return (
                    <Card
                      key={ticket.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isPriority && "border-l-4 border-l-red-500",
                        isOverdue && "border-l-4 border-l-orange-500"
                      )}
                      onClick={() => navigate( `/tickets/${ticket.id}` )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-sm leading-tight flex-1">
                            {ticket.title}
                          </CardTitle>
                          <div className="flex gap-1 flex-shrink-0">
                            <Badge className={cn( "text-xs", getPriorityColor( ticket.priority ) )}>
                              {ticket.priority}
                            </Badge>
                            <Badge className={cn( "text-xs", getStatusColor( ticket.status ) )}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {ticket.status.replace( '_', ' ' )}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.description}
                        </p>

                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{ticket.location}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date( ticket.createdAt ).toLocaleDateString()}</span>
                            </div>

                            {ticket.dueDate && (
                              <div className={cn(
                                "flex items-center gap-1",
                                isOverdue && "text-red-600"
                              )}>
                                <Clock className="w-3 h-3" />
                                <span>Due {new Date( ticket.dueDate ).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {ticket.assignedToProfile && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>Assigned to {ticket.assignedToProfile.fullName || ticket.assignedToProfile.email}</span>
                            </div>
                          )}

                          {ticket.createdByProfile && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>Created by {ticket.createdByProfile.fullName || ticket.createdByProfile.email}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                } )
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
