import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTickets } from '../hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Shield,
  Users,
  Timer,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Activity,
  Target,
  UserCheck,
  Building,
  Award
} from 'lucide-react';
import { dbHelpers as db } from '../lib/dbhelper';
import { UserProfile } from '../models/User';
import { cn } from '../lib/utils';

interface SupervisorPerformance {
  supervisor: UserProfile;
  teamSize: number;
  managedTickets: number;
  resolvedTickets: number;
  avgTeamResolutionTime: number;
  teamCompletionRate: number;
  workload: 'low' | 'medium' | 'high' | 'overloaded';
  recentActivity: {
    date: string;
    action: string;
    ticket?: string;
  }[];
}

export default function SupervisorsPage() {

  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { tickets } = useTickets();
  const [supervisors, setSupervisors] = useState<UserProfile[]>([]);
  const [supervisorPerformance, setSupervisorPerformance] = useState<SupervisorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterWorkload, setFilterWorkload] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [expandedSupervisors, setExpandedSupervisors] = useState<Set<string>>(new Set());

  const isAdmin = profile?.role === 'admin';

  const loadSupervisorsData = useCallback(async () => {
    
    try {
    
      // Load supervisors
      let supervisorsData: UserProfile[];
    
      try {

        supervisorsData = await db.getUsers('supervisor');

      } catch (error) {

        console.log(" Failed to get supervisors", error);

      }
      
      setSupervisors(supervisorsData || []);

      // Load all engineers for team size calculation
      let engineersData: UserProfile[];

      try {

        engineersData = await db.getUsers('field_engineer');

      } catch (error) {

        console.log("Failed to load engineers", error);

      }

      // Calculate performance metrics
      const performance = (supervisorsData || []).map(supervisor => {
       
        // Find engineers under this supervisor (same department)
        const teamEngineers = (engineersData || []).filter(e => 
          e.department === supervisor.department
        );
        
        // Find tickets managed by this supervisor or their team
        const managedTickets = tickets.filter(t => 
          t.assignedByProfile.id === supervisor.id || 
          teamEngineers.some(e => e.id === t.assignedTo)
        );
        
        const resolvedTickets = managedTickets.filter(t => 
          ['resolved', 'verified', 'closed'].includes(t.status)
        );
        
        const avgTeamResolutionTime = resolvedTickets.length > 0
          ? resolvedTickets.reduce((acc, ticket) => {

              if (ticket.resolvedAt) {
                const resolutionTime = new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime();
                return acc + (resolutionTime / (1000 * 60 * 60)); // Convert to hours
              }

              return acc;
            
            }, 0) / resolvedTickets.length
          : 0;

        const teamCompletionRate = managedTickets.length > 0 
          ? (resolvedTickets.length / managedTickets.length) * 100 
          : 0;

        // Determine workload based on team size and active tickets
        const activeTickets = managedTickets.filter(t => 
          !['resolved', 'verified', 'closed'].includes(t.status)
        ).length;
        
        let workload: 'low' | 'medium' | 'high' | 'overloaded' = 'low';
        
        if (activeTickets > teamEngineers.length * 3) workload = 'overloaded';
        
        else if (activeTickets > teamEngineers.length * 2) workload = 'high';
        
        else if (activeTickets > teamEngineers.length) workload = 'medium';

        // Generate recent activity (mock)
        const recentActivity = resolvedTickets
          .slice(-5)
          .map(ticket => ({
            date: ticket.resolvedAt || ticket.updatedAt,
            action: 'Ticket resolved',
            ticket: ticket.title
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
          supervisor,
          teamSize: teamEngineers.length,
          managedTickets: managedTickets.length,
          resolvedTickets: resolvedTickets.length,
          avgTeamResolutionTime,
          teamCompletionRate,
          workload,
          recentActivity
        };
      });

      setSupervisorPerformance(performance);
    
    } catch (error) {
    
      console.error('Error loading supervisors data:', error);
    
    } finally {
    
      setLoading(false);
    
    }
  
  }, [tickets]);

  useEffect(() => {
    loadSupervisorsData();
  }, [loadSupervisorsData]);

  // Check permissions
  if (!profile || !['admin'].includes(profile.role)) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only administrators can view supervisor management.</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  // Get unique departments
  const departments = [...new Set(supervisors.map(s => s.department).filter(Boolean))].sort();

  // Filter and sort supervisors
  const filteredSupervisors = supervisorPerformance.filter(sp => {
    const matchesSearch = sp.supervisor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sp.supervisor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sp.supervisor.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || sp.supervisor.department === filterDepartment;
    const matchesWorkload = filterWorkload === 'all' || sp.workload === filterWorkload;
    return matchesSearch && matchesDepartment && matchesWorkload;
  });

  const sortedSupervisors = [...filteredSupervisors].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.supervisor.fullName || a.supervisor.email).localeCompare(b.supervisor.fullName || b.supervisor.email);
      case 'team_size':
        return b.teamSize - a.teamSize;
      case 'performance':
        return b.teamCompletionRate - a.teamCompletionRate;
      case 'workload':
        return b.managedTickets - a.managedTickets;
      default:
        return 0;
    }
  });

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'overloaded': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const toggleExpanded = (supervisorId: string) => {
    setExpandedSupervisors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supervisorId)) {
        newSet.delete(supervisorId);
      } else {
        newSet.add(supervisorId);
      }
      return newSet;
    });
  };

  const isExpanded = (supervisorId: string) => expandedSupervisors.has(supervisorId);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Supervisor Management
        </h1>
        <p className="text-muted-foreground">
          Monitor supervisor performance, team management, and productivity
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search supervisors, emails, departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full md:w-48">
                <Building className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterWorkload} onValueChange={setFilterWorkload}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workloads</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="overloaded">Overloaded</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="team_size">Sort by Team Size</SelectItem>
                <SelectItem value="performance">Sort by Performance</SelectItem>
                <SelectItem value="workload">Sort by Workload</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{supervisors.length}</div>
            <div className="text-sm text-muted-foreground">Total Supervisors</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">
              {supervisorPerformance.reduce((acc, sp) => acc + sp.teamSize, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Engineers Managed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">
              {supervisorPerformance.filter(sp => sp.workload === 'overloaded').length}
            </div>
            <div className="text-sm text-muted-foreground">Overloaded</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">
              {supervisorPerformance.length > 0 
                ? Math.round(supervisorPerformance.reduce((acc, sp) => acc + sp.teamCompletionRate, 0) / supervisorPerformance.length)
                : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Success Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Supervisors List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Supervisors ({filteredSupervisors.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on any supervisor to expand details, or double-click to view profile
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {sortedSupervisors.map((sp) => (
              <div key={sp.supervisor.id} className="border-b last:border-0">
                {/* One-liner Summary */}
                <div 
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => toggleExpanded(sp.supervisor.id)}
                  onDoubleClick={() => navigate(`/profile/${sp.supervisor.id}`)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {sp.supervisor.fullName 
                          ? sp.supervisor.fullName.substring(0, 2).toUpperCase() 
                          : sp.supervisor.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {sp.supervisor.fullName || sp.supervisor.email}
                        </span>
                        <Badge className={cn("text-xs", getWorkloadColor(sp.workload))}>
                          {sp.workload}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {sp.supervisor.department || 'Supervisor'} • {sp.teamSize} engineers • {sp.teamCompletionRate.toFixed(0)}% success
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center hidden sm:block">
                      <div className="font-semibold text-blue-600">{sp.teamSize}</div>
                      <div className="text-xs text-muted-foreground">Team</div>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className="font-semibold text-green-600">{sp.resolvedTickets}</div>
                      <div className="text-xs text-muted-foreground">Resolved</div>
                    </div>
                    <div className="text-center hidden lg:block">
                      <div className="font-semibold text-purple-600">{sp.avgTeamResolutionTime.toFixed(1)}h</div>
                      <div className="text-xs text-muted-foreground">Avg Time</div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded(sp.supervisor.id) ? '▼' : '▶'}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded(sp.supervisor.id) && (
                  <div className="p-4 bg-muted/30 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Team Metrics */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Team Performance</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 bg-background rounded">
                            <div className="text-lg font-bold text-blue-600">{sp.teamSize}</div>
                            <div className="text-xs text-muted-foreground">Team Size</div>
                          </div>
                          <div className="text-center p-2 bg-background rounded">
                            <div className="text-lg font-bold text-green-600">{sp.managedTickets}</div>
                            <div className="text-xs text-muted-foreground">Managed Tickets</div>
                          </div>
                          <div className="text-center p-2 bg-background rounded">
                            <div className="text-lg font-bold text-purple-600">{sp.teamCompletionRate.toFixed(0)}%</div>
                            <div className="text-xs text-muted-foreground">Team Success</div>
                          </div>
                          <div className="text-center p-2 bg-background rounded">
                            <div className="text-lg font-bold text-orange-600">{sp.avgTeamResolutionTime.toFixed(1)}h</div>
                            <div className="text-xs text-muted-foreground">Avg Resolution</div>
                          </div>
                        </div>
                      </div>

                      {/* Department Info */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Department Details</h4>
                        <div className="p-3 bg-background rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="w-4 h-4" />
                            <span className="font-medium">{sp.supervisor.department || 'No Department'}</span>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Status: {sp.supervisor.isActive ? 'Active' : 'Inactive'}</div>
                            <div>Joined: {new Date(sp.supervisor.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Recent Activity</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {sp.recentActivity.length > 0 ? sp.recentActivity.map((activity, index) => (
                            <div key={index} className="text-sm p-2 bg-background rounded">
                              <div className="font-medium">{activity.action}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(activity.date).toLocaleDateString()} • {activity.ticket}
                              </div>
                            </div>
                          )) : (
                            <div className="text-sm text-muted-foreground">No recent activity</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/tickets?supervisor_id=${sp.supervisor.id}`)}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        View Managed Tickets
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/engineers?department=${sp.supervisor.department}`)}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        View Team
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/profile/${sp.supervisor.id}`)}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredSupervisors.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Supervisors Found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
