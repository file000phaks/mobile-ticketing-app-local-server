/**
 * ..fileoverview Resolved tickets history page for administrators and supervisors
 * ..author Field Engineer Portal Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useResolvedTickets, useResolvedTicketStats } from '../hooks/useResolvedTickets';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Archive,
  Search,
  Filter,
  Download,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  BarChart3,
  AlertTriangle,
  User,
  MapPin,
  FileText,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addDays, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import SimpleBarChart from '../components/charts/SimpleBarChart';
import SimpleLineChart from '../components/charts/SimpleLineChart';
import DonutChart from '../components/charts/DonutChart';
import { toast } from '../components/ui/use-toast';

/**
 * Interface for filter state
 */
interface FilterState {
  search: string;
  dateRange: DateRange | undefined;
  resolvedBy: string;
  priority: string;
  type: string;
  createdBy: string;
}

export default function ResolvedTicketsPage() {

  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    resolvedTickets,
    stats,
    loading,
    error,
    totalCount,
    loadResolvedTickets,
    exportToCSV,
    cleanupOldTickets,
    searchResolvedTickets,
    canViewResolvedTickets,
    canCleanupTickets
  } = useResolvedTickets();

  const [ filters, setFilters ] = useState<FilterState>( {
    search: '',
    dateRange: undefined,
    resolvedBy: 'all',
    priority: 'all',
    type: 'all',
    createdBy: 'all'
  } );

  const [ showCleanupDialog, setShowCleanupDialog ] = useState( false );
  const [ cleanupDate, setCleanupDate ] = useState<Date>();

  // Check permissions
  if ( !profile || !canViewResolvedTickets ) {

    return (

      <div className="max-w-4xl mx-auto p-4 md:p-6 text-center">

        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to view resolved tickets.</p>
        <Button onClick={() => navigate( '/' )} className="mt-4">
          Return to Dashboard
        </Button>

      </div>

    );

  }

  /**
   * Applies current filters to load tickets
   */
  const applyFilters = useCallback( async () => {

    const filterOptions = {
      startDate: filters.dateRange?.from,
      endDate: filters.dateRange?.to,
      resolvedBy: filters.resolvedBy !== 'all' ? filters.resolvedBy : undefined,
      priority: filters.priority !== 'all' ? [ filters.priority ] : undefined,
      type: filters.type !== 'all' ? [ filters.type ] : undefined,
      createdBy: filters.createdBy !== 'all' ? filters.createdBy : undefined,
      limit: 100 // Reasonable limit for UI
    };

    if ( filters.search.trim() ) {

      await searchResolvedTickets( filters.search, filterOptions );

    } else {

      await loadResolvedTickets( filterOptions );

    }

  }, [ filters, searchResolvedTickets, loadResolvedTickets ] )

  /**
   * Resets all filters
   */
  const resetFilters = () => {

    setFilters( {
      search: '',
      dateRange: undefined,
      resolvedBy: 'all',
      priority: 'all',
      type: 'all',
      createdBy: 'all'
    } );

  };

  /**
   * Handles CSV export
   */
  const handleExport = async () => {

    const filterOptions = {
      startDate: filters.dateRange?.from,
      endDate: filters.dateRange?.to,
      resolvedBy: filters.resolvedBy !== 'all' ? filters.resolvedBy : undefined,
      priority: filters.priority !== 'all' ? [ filters.priority ] : undefined,
      type: filters.type !== 'all' ? [ filters.type ] : undefined,
      createdBy: filters.createdBy !== 'all' ? filters.createdBy : undefined
    };

    await exportToCSV( filterOptions );

  };

  /**
   * Handles cleanup of old resolved tickets
   */
  const handleCleanup = async () => {

    if ( !cleanupDate || !canCleanupTickets ) return;

    try {

      const deletedCount = await cleanupOldTickets( cleanupDate );
      setShowCleanupDialog( false );
      setCleanupDate( undefined );

    } catch ( error ) {

      // Error handling is done in the hook

    }

  };

  /**
   * Gets the color class for priority badges
   */
  const getPriorityColor = ( priority: string ) => {

    switch ( priority ) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }

  };

  /**
   * Formats resolution time for display
   */
  const formatResolutionTime = ( hours: number ) => {

    if ( hours < 24 ) {

      return `${hours.toFixed( 1 )}h`;

    } else {

      const days = Math.floor( hours / 24 );
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours.toFixed( 1 )}h`;

    }

  };

  // Apply filters when they change
  useEffect( () => {

    applyFilters();

  }, [ filters, searchResolvedTickets, loadResolvedTickets ] );

  return (

    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20">

      {/* Header */}

      <div className="flex justify-between items-start">

        <div>

          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="w-6 h-6" />
            Resolved Tickets History
          </h1>

          <p className="text-muted-foreground">
            View and analyze completed tickets and resolution metrics
          </p>

        </div>

        <div className="flex gap-2">

          <Button variant="outline" onClick={handleExport} disabled={loading}>

            <Download className="w-4 h-4 mr-2" />
            Export CSV

          </Button>

          {canCleanupTickets && (

            <Button
              variant="outline"
              onClick={() => setShowCleanupDialog( true )}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cleanup Old
            </Button>
          )}

          <Button variant="outline" onClick={applyFilters} disabled={loading}>
            <RefreshCw className={cn( "w-4 h-4 mr-2", loading && "animate-spin" )} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets">Resolved Tickets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
        </TabsList>

        {/* Resolved Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search tickets..."
                      value={filters.search}
                      onChange={( e ) => setFilters( prev => ( { ...prev, search: e.target.value } ) )}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange?.from ? (
                          filters.dateRange.to ? (
                            `${format( filters.dateRange.from, "MMM dd" )} - ${format( filters.dateRange.to, "MMM dd" )}`
                          ) : (
                            format( filters.dateRange.from, "MMM dd, yyyy" )
                          )
                        ) : (
                          "Date range"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={filters.dateRange?.from}
                        selected={filters.dateRange}
                        onSelect={( range ) => setFilters( prev => ( { ...prev, dateRange: range } ) )}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Priority Filter */}
                <div>
                  <Select value={filters.priority} onValueChange={( value ) => setFilters( prev => ( { ...prev, priority: value } ) )}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div>
                  <Select value={filters.type} onValueChange={( value ) => setFilters( prev => ( { ...prev, type: value } ) )}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="preventive">Preventive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset Button */}
                <div>
                  <Button variant="outline" onClick={resetFilters} className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {resolvedTickets.length} of {totalCount} resolved tickets
              </p>
              {error && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {error}
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[ ...Array( 6 ) ].map( ( _, i ) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ) )}
              </div>
            ) : resolvedTickets.length === 0 ? (
              <Card className="p-12 text-center">
                <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Resolved Tickets Found</h3>
                <p className="text-muted-foreground">
                  {filters.search || filters.dateRange || filters.priority !== 'all' || filters.type !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No tickets have been resolved yet.'}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolvedTickets.map( ( ticket ) => (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-sm leading-tight flex-1">
                          {ticket.title}
                        </CardTitle>
                        <div className="flex gap-1 flex-shrink-0">
                          <Badge className={cn( "text-xs", getPriorityColor( ticket.priority ) )}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {ticket.type}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{ticket.location}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            Resolved by {ticket.resolved_by_profile?.full_name || ticket.resolved_by_profile?.email || 'Unknown'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>
                            {ticket.resolution_time_hours
                              ? formatResolutionTime( ticket.resolution_time_hours )
                              : 'No time recorded'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 flex-shrink-0" />
                          <span>Resolved {format( new Date( ticket.resolved_at ), 'MMM dd, yyyy' )}</span>
                        </div>
                      </div>

                      {ticket.resolution_notes && (
                        <div className="pt-2 border-t">
                          <div className="flex items-start gap-1">
                            <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {ticket.resolution_notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {stats ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">{stats.totalResolved}</div>
                    <div className="text-sm text-muted-foreground">Total Resolved</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">{formatResolutionTime( stats.avgResolutionTime )}</div>
                    <div className="text-sm text-muted-foreground">Avg Resolution</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">{stats.resolvedThisMonth}</div>
                    <div className="text-sm text-muted-foreground">This Month</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold">{stats.resolvedThisWeek}</div>
                    <div className="text-sm text-muted-foreground">This Week</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resolution Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resolution Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.resolutionTrends.length > 0 ? (
                      <SimpleLineChart
                        title="Monthly Resolution Trends"
                        data={stats.resolutionTrends.map( trend => ( {
                          label: trend.month,
                          value: trend.count
                        } ) )}
                        height={200}
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground">
                        No trend data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Resolvers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Resolvers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.topResolvers.length > 0 ? (
                      <div className="space-y-2">
                        {stats.topResolvers.slice( 0, 5 ).map( ( resolver, index ) => (
                          <div key={resolver.userId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </div>
                              <span className="text-sm font-medium">
                                {resolver.userProfile?.fullName || resolver.userProfile?.email || 'Unknown'}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold">{resolver.count}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatResolutionTime( resolver.avgTime )}
                              </div>
                            </div>
                          </div>
                        ) )}
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground">
                        No resolver data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Loading Analytics</h3>
              <p className="text-muted-foreground">
                Please wait while we load the analytics data...
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Cleanup Dialog */}
      {showCleanupDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Cleanup Old Resolved Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will permanently delete resolved tickets older than the selected date. This action cannot be undone.
              </p>

              <div>
                <label className="text-sm font-medium">Delete tickets resolved before:</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !cleanupDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {cleanupDate ? format( cleanupDate, "PPP" ) : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={cleanupDate}
                      onSelect={setCleanupDate}
                      disabled={( date ) => date > new Date() || date < subMonths( new Date(), 24 )}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCleanupDialog( false );
                    setCleanupDate( undefined );
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCleanup}
                  disabled={!cleanupDate}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
