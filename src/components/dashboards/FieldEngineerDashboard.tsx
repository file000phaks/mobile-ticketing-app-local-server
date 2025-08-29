import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTickets } from '../../hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  MapPin,
  Calendar,
  TrendingUp,
  Target,
  Timer,
  Award,
  BarChart3,
  Activity
} from 'lucide-react';
import SimpleBarChart from '../charts/SimpleBarChart';
import DonutChart from '../charts/DonutChart';
import SimpleLineChart from '../charts/SimpleLineChart';
import { dbHelpers as db } from '../../lib/dbhelper';
import { cn } from '../../lib/utils';

interface DashboardStats {
  assigned_tickets: number;
  in_progress_tickets: number;
  resolved_this_week: number;
  avg_resolution_hours: number;
  overdue_tickets: number;
}

export default function FieldEngineerDashboard() {
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, getAssignedTickets, getMyTickets, getOverdueTickets } = useTickets();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    loadDashboardStats();

  }, [user]);

  const loadDashboardStats = async () => {
   
    if (!user) return;

    try {
    
      const dashboardData = await db.getDashboardStats(user.id);
    
      setStats({
        assigned_tickets: dashboardData?.assigned_tickets || 0,
        in_progress_tickets: dashboardData?.in_progress_tickets || 0,
        resolved_this_week: dashboardData?.resolved_tickets || 0,
        avg_resolution_hours: dashboardData?.avg_resolution_hours || 0,
        overdue_tickets: dashboardData?.overdue_tickets || 0
      });
    
    } 
    
    catch (error) {
    
      console.error('Error loading dashboard stats:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: user?.id,
        component: 'FieldEngineerDashboard',
        error: error
      });
    }
    
    finally {
    
      setLoading(false);
    
    }
  
  };

  const assignedTickets = getAssignedTickets();
  const myTickets = getMyTickets();
  const overdueTickets = getOverdueTickets();

  // Separate assigned tickets from created tickets
  const myAssignedTickets = assignedTickets.filter(t => t.assignedTo === user?.id);
  const myCreatedTickets = myTickets.filter(t => t.createdBy === user?.id);

  // Get recent assigned tickets
  const recentAssigned = myAssignedTickets
    .sort((a, b) => new Date(b.assignedAt || b.createdAt).getTime() - new Date(a.assignedAt || a.createdAt).getTime())
    .slice(0, 5);

  // Get tickets by priority for assigned tickets
  const criticalAssigned = myAssignedTickets.filter(t => t.priority === 'critical').length;
  const highAssigned = myAssignedTickets.filter(t => t.priority === 'high').length;

  // Calculate completion rate
  const completedTickets = myAssignedTickets.filter(t => ['resolved', 'verified', 'closed'].includes(t.status)).length;
  const completionRate = myAssignedTickets.length > 0 ? (completedTickets / myAssignedTickets.length) * 100 : 0;

  // Prepare chart data
  const priorityData = [
    { label: 'Critical', value: myAssignedTickets.filter(t => t.priority === 'critical').length, color: '#dc2626' },
    { label: 'High', value: myAssignedTickets.filter(t => t.priority === 'high').length, color: '#ea580c' },
    { label: 'Medium', value: myAssignedTickets.filter(t => t.priority === 'medium').length, color: '#ca8a04' },
    { label: 'Low', value: myAssignedTickets.filter(t => t.priority === 'low').length, color: '#16a34a' }
  ];

  const statusData = [
    { label: 'Open', value: myAssignedTickets.filter(t => t.status === 'open').length, color: '#2563eb' },
    { label: 'In Progress', value: myAssignedTickets.filter(t => t.status === 'in_progress').length, color: '#ea580c' },
    { label: 'Resolved', value: myAssignedTickets.filter(t => t.status === 'resolved').length, color: '#16a34a' },
    { label: 'Verified', value: myAssignedTickets.filter(t => t.status === 'verified').length, color: '#059669' }
  ];

  // Weekly performance data (mock for demonstration)
  const weeklyData = [
    { label: 'Mon', value: 3 },
    { label: 'Tue', value: 5 },
    { label: 'Wed', value: 2 },
    { label: 'Thu', value: 8 },
    { label: 'Fri', value: 6 },
    { label: 'Sat', value: 1 },
    { label: 'Sun', value: 0 }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'assigned': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
      case 'in_progress': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'resolved': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'verified': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200';
      case 'closed': return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Field Engineer Dashboard</h1>
        <p className="text-muted-foreground">
          Your work assignments and progress
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.assigned_tickets || 0}</p>
                <p className="text-sm text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.in_progress_tickets || 0}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.resolved_this_week || 0}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "hover:shadow-md transition-shadow",
          overdueTickets.length > 0 && "border-red-200 dark:border-red-800"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className={cn(
                "w-5 h-5",
                overdueTickets.length > 0 ? "text-red-600" : "text-gray-400"
              )} />
              <div>
                <p className="text-2xl font-bold">{overdueTickets.length}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm text-muted-foreground">{completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Avg Resolution</span>
              </div>
              <p className="text-lg font-bold">
                {stats?.avg_resolution_hours ? `${stats.avg_resolution_hours.toFixed(1)}h` : '0h'}
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Priority Work</span>
              </div>
              <p className="text-lg font-bold">{criticalAssigned + highAssigned}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-10">
        <DonutChart
          title="Tickets by Priority"
          data={priorityData}
          centerText="Total"
          centerValue={myAssignedTickets.length}
        />

        <DonutChart
          title="Tickets by Status"
          data={statusData}
          centerText="Assigned"
          centerValue={myAssignedTickets.length}
        />

        <SimpleLineChart
          title="Weekly Activity"
          data={weeklyData}
          color="#2563eb"
        />
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SimpleBarChart
              title="This Month's Progress"
              data={[
                { label: 'Completed', value: completedTickets, color: '#16a34a' },
                { label: 'In Progress', value: myAssignedTickets.filter(t => t.status === 'in_progress').length, color: '#ea580c' },
                { label: 'Pending', value: myAssignedTickets.filter(t => t.status === 'open').length, color: '#2563eb' }
              ]}
            />

            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span className="font-medium">{completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Resolution Time</span>
                    <span className="font-medium">
                      {stats?.avg_resolution_hours ? `${stats.avg_resolution_hours.toFixed(1)}h` : '0h'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Critical Priority</span>
                    <span className="font-medium text-red-600">{criticalAssigned}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Alerts */}
      {(criticalAssigned > 0 || overdueTickets.length > 0) && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Priority Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalAssigned > 0 && (
              <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                <span className="text-sm font-medium">Critical Tickets Assigned</span>
                <Badge variant="destructive">{criticalAssigned}</Badge>
              </div>
            )}
            {overdueTickets.length > 0 && (
              <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950/20 rounded">
                <span className="text-sm font-medium">Overdue Tickets</span>
                <Badge variant="destructive">{overdueTickets.length}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={() => navigate('/create')} 
            className="w-full justify-start h-12"
          >
            <AlertTriangle className="w-4 h-4 mr-3" />
            Report New Issue
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/tickets?filter=assigned')} 
            className="w-full justify-start h-12"
          >
            <Target className="w-4 h-4 mr-3" />
            View My Assigned Tickets ({myAssignedTickets.length})
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/map')} 
            className="w-full justify-start h-12"
          >
            <MapPin className="w-4 h-4 mr-3" />
            Field Map View
          </Button>
        </CardContent>
      </Card>

      {/* Recently Assigned Tickets */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Recently Assigned</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/tickets?filter=assigned')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAssigned.length > 0 ? recentAssigned.map((ticket) => (
              <div 
                key={ticket.id} 
                className="flex items-start justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-sm leading-tight">{ticket.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{ticket.location}</span>
                    <Calendar className="w-3 h-3 ml-2" />
                    <span>{new Date(ticket.assignedAt || ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0 ml-2">
                  <Badge className={cn("text-xs", getPriorityColor(ticket.priority))}>
                    {ticket.priority}
                  </Badge>
                  <Badge className={cn("text-xs", getStatusColor(ticket.status))}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tickets assigned yet</p>
                <p className="text-xs">New assignments will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Created Tickets */}
      {myCreatedTickets.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">My Reported Issues</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/tickets?filter=created')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myCreatedTickets.slice(0, 3).map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium text-sm leading-tight">{ticket.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.assignedToProfile && (
                        <>
                          <span>•</span>
                          <span>Assigned to {ticket.assignedToProfile.fullName || ticket.assignedToProfile.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0 ml-2">
                    <Badge className={cn("text-xs", getPriorityColor(ticket.priority))}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={cn("text-xs", getStatusColor(ticket.status))}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
