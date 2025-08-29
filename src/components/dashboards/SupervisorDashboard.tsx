import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTickets } from '../../hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  UserPlus,
  BarChart3,
  Shield,
  UserCheck,
  Calendar,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { dbHelpers as db } from '../../lib/dbhelper';
import { UserProfile } from '../../models/User';
import { cn } from '../../lib/utils';

interface TeamStats {
  total_engineers: number;
  active_engineers: number;
  total_tickets: number;
  unassigned_tickets: number;
  overdue_tickets: number;
  critical_tickets: number;
}

export default function SupervisorDashboard() {
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, getUnassignedTickets, getOverdueTickets, assignTicket } = useTickets();
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [engineers, setEngineers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   
    loadDashboardData();
  
  }, [user]);

  const loadDashboardData = async () => {
    
    if (!user) return;

    try {

      // Load engineers
      const engineersData = await db.getUsers('field_engineer');
      setEngineers(engineersData || []);

      // Load dashboard stats
      const dashboardData = await db.getDashboardStats(user.id);
      
      setTeamStats({
        total_engineers: engineersData?.length || 0,
        active_engineers: engineersData?.filter(e => e.isActive).length || 0,
        total_tickets: dashboardData?.total_tickets || 0,
        unassigned_tickets: dashboardData?.open_tickets || 0,
        overdue_tickets: dashboardData?.overdue_tickets || 0,
        critical_tickets: dashboardData?.critical_tickets || 0,
      });
   
    } catch (error) {
   
      console.error('Error loading dashboard data:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        component: 'SupervisorDashboard',
        operation: 'loadDashboardData',
        error: error
      });
   
    } finally {
   
      setLoading(false);
   
    }
  
  };

  const unassignedTickets = getUnassignedTickets();
  const overdueTickets = getOverdueTickets();
  const criticalTickets = tickets.filter(t => t.priority === 'critical');
  const recentTickets = tickets
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  // Engineer workload analysis
  const engineerWorkload = engineers.map(engineer => {
  
    const assignedTickets = tickets.filter(t => t.assignedTo === engineer.id);
    const activeTickets = assignedTickets.filter(t => ['assigned', 'in_progress'].includes(t.status));
    const completedThisWeek = assignedTickets.filter(t => 
      t.status === 'resolved' && 
      t.resolvedAt && 
      new Date(t.resolvedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    return {
      engineer,
      totalAssigned: assignedTickets.length,
      activeTickets: activeTickets.length,
      completedThisWeek: completedThisWeek.length,
      workload: activeTickets.length // Simple workload metric
    };
  
  });

  const handleQuickAssign = async (ticketId: string, engineerId: string) => {
   
    try {
   
      await assignTicket(ticketId, engineerId);
   
    } catch (error) {
   
      console.error('Error assigning ticket:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ticketId: ticketId,
        engineerId: engineerId,
        component: 'SupervisorDashboard',
        error: error
      });
    }

  };

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
          {[...Array(6)].map((_, i) => (
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
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Supervisor Dashboard
        </h1>
        <p className="text-muted-foreground">
          Team oversight and ticket management
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{teamStats?.active_engineers || 0}</p>
                <p className="text-sm text-muted-foreground">Active Engineers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{teamStats?.total_tickets || 0}</p>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "hover:shadow-md transition-shadow",
          (teamStats?.unassigned_tickets || 0) > 0 && "border-yellow-200 dark:border-yellow-800"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className={cn(
                "w-5 h-5",
                (teamStats?.unassigned_tickets || 0) > 0 ? "text-yellow-600" : "text-gray-400"
              )} />
              <div>
                <p className="text-2xl font-bold">{teamStats?.unassigned_tickets || 0}</p>
                <p className="text-sm text-muted-foreground">Unassigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "hover:shadow-md transition-shadow",
          (teamStats?.critical_tickets || 0) > 0 && "border-red-200 dark:border-red-800"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className={cn(
                "w-5 h-5",
                (teamStats?.critical_tickets || 0) > 0 ? "text-red-600" : "text-gray-400"
              )} />
              <div>
                <p className="text-2xl font-bold">{teamStats?.critical_tickets || 0}</p>
                <p className="text-sm text-muted-foreground">Critical</p>
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
              <Clock className={cn(
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
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(((teamStats?.total_tickets || 0) - unassignedTickets.length) / Math.max(teamStats?.total_tickets || 1, 1) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Actions */}
      {(unassignedTickets.length > 0 || criticalTickets.length > 0 || overdueTickets.length > 0) && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Requires Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unassignedTickets.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/tickets?status=open&assigned=false')}
                className="w-full justify-between"
              >
                <span>Unassigned Tickets Need Assignment</span>
                <Badge variant="secondary">{unassignedTickets.length}</Badge>
              </Button>
            )}
            {criticalTickets.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/tickets?priority=critical')}
                className="w-full justify-between"
              >
                <span>Critical Priority Tickets</span>
                <Badge variant="destructive">{criticalTickets.length}</Badge>
              </Button>
            )}
            {overdueTickets.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/tickets?overdue=true')}
                className="w-full justify-between"
              >
                <span>Overdue Tickets</span>
                <Badge variant="destructive">{overdueTickets.length}</Badge>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Workload */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Workload
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
              Manage Team
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {engineerWorkload.length > 0 ? engineerWorkload.map(({ engineer, totalAssigned, activeTickets, completedThisWeek, workload }) => (
              <div key={engineer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {engineer.fullName ? engineer.fullName.substring(0, 2).toUpperCase() : engineer.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{engineer.fullName || engineer.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeTickets} active • {completedThisWeek} completed this week
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={workload > 5 ? "destructive" : workload > 2 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {workload} tickets
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/tickets?assigned_to=${engineer.id}`)}
                    className="h-8 px-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No field engineers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Assignment */}
      {unassignedTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Quick Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unassignedTickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-medium text-sm leading-tight">{ticket.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{ticket.location}</span>
                      <Calendar className="w-3 h-3 ml-2" />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Badge className={cn("text-xs w-fit", getPriorityColor(ticket.priority))}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-2 flex-shrink-0 ml-3">
                    <Select onValueChange={(value) => handleQuickAssign(ticket.id, value)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {engineers.filter(e => e.isActive).map((engineer) => {
                          const workload = engineerWorkload.find(w => w.engineer.id === engineer.id)?.workload || 0;
                          return (
                            <SelectItem key={engineer.id} value={engineer.id}>
                              <div className="flex items-center justify-between w-full">
                                <span className="truncate">{engineer.fullName || engineer.email}</span>
                                <Badge variant={workload > 5 ? "destructive" : "secondary"} className="ml-2 text-xs">
                                  {workload}
                                </Badge>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="h-8 px-2 text-xs"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
            onClick={() => navigate('/tickets')} 
            className="w-full justify-start h-12"
          >
            <BarChart3 className="w-4 h-4 mr-3" />
            View All Tickets ({tickets.length})
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/tickets?status=resolved')} 
            className="w-full justify-start h-12"
          >
            <UserCheck className="w-4 h-4 mr-3" />
            Verify Completed Work
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/users')} 
            className="w-full justify-start h-12"
          >
            <Users className="w-4 h-4 mr-3" />
            Manage Team Members
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Recent Ticket Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTickets.slice(0, 5).map((ticket) => (
              <div 
                key={ticket.id} 
                className="flex items-start justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-sm leading-tight">{ticket.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>By {ticket.createdByProfile?.fullName || ticket.createdByProfile?.email}</span>
                    <Calendar className="w-3 h-3 ml-2" />
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
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
    </div>
  );
}
