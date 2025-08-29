import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Loader2,
  Calendar,
  Target
} from 'lucide-react';

interface Engineer {
  id: string;
  full_name: string;
  email: string;
  location: string;
  skills: string[];
  availability: 'available' | 'busy' | 'offline';
  assignedTickets: {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
  };
  performance: {
    completionRate: number;
    avgResolutionTime: number; // hours
    rating: number;
  };
  workload: number; // percentage
  lastActive: Date;
}

interface EngineersOverviewProps {
  onAssignTicket?: (engineerId: string) => void;
}

export default function EngineersOverview({ onAssignTicket }: EngineersOverviewProps) {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'busy' | 'offline'>('all');

  // Mock engineer data with comprehensive metrics
  const mockEngineers: Engineer[] = [
    {
      id: '3',
      full_name: 'Field Engineer',
      email: 'engineer@test.com',
      location: 'Building A - Zone 1',
      skills: ['HVAC', 'Electrical', 'Plumbing'],
      availability: 'available',
      assignedTickets: { total: 5, open: 1, in_progress: 2, resolved: 2 },
      performance: { completionRate: 85, avgResolutionTime: 4.2, rating: 4.3 },
      workload: 40,
      lastActive: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      id: '4',
      full_name: 'Senior Technician',
      email: 'senior@test.com',
      location: 'Building B - Zone 2',
      skills: ['HVAC', 'Mechanical', 'Fire Safety'],
      availability: 'busy',
      assignedTickets: { total: 8, open: 2, in_progress: 4, resolved: 2 },
      performance: { completionRate: 92, avgResolutionTime: 3.8, rating: 4.7 },
      workload: 85,
      lastActive: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    },
    {
      id: '5',
      full_name: 'Maintenance Specialist',
      email: 'maintenance@test.com',
      location: 'Building C - Zone 3',
      skills: ['Electrical', 'Security Systems'],
      availability: 'available',
      assignedTickets: { total: 3, open: 0, in_progress: 1, resolved: 2 },
      performance: { completionRate: 78, avgResolutionTime: 5.1, rating: 4.1 },
      workload: 25,
      lastActive: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
    },
    {
      id: '6',
      full_name: 'Equipment Expert',
      email: 'expert@test.com',
      location: 'Building A - Zone 2',
      skills: ['HVAC', 'Elevators', 'Generators'],
      availability: 'offline',
      assignedTickets: { total: 6, open: 1, in_progress: 1, resolved: 4 },
      performance: { completionRate: 88, avgResolutionTime: 3.5, rating: 4.5 },
      workload: 35,
      lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    }
  ];

  useEffect(() => {
    const loadEngineers = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setEngineers(mockEngineers);
      } catch (error) {
        console.error('Error loading engineers:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          component: 'EngineersOverview',
          operation: 'loadEngineers',
          error: error
        });
      } finally {
        setLoading(false);
      }
    };

    loadEngineers();
  }, []);

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available': return 'default';
      case 'busy': return 'secondary';
      case 'offline': return 'destructive';
      default: return 'secondary';
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload < 40) return 'bg-green-500';
    if (workload < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredEngineers = engineers.filter(engineer => 
    selectedFilter === 'all' || engineer.availability === selectedFilter
  );

  const availabilityStats = {
    total: engineers.length,
    available: engineers.filter(e => e.availability === 'available').length,
    busy: engineers.filter(e => e.availability === 'busy').length,
    offline: engineers.filter(e => e.availability === 'offline').length
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-3">Loading engineers...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Total Engineers</span>
            </div>
            <p className="text-2xl font-bold mt-1">{availabilityStats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Available</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">{availabilityStats.available}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium">Busy</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-600">{availabilityStats.busy}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium">Offline</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{availabilityStats.offline}</p>
          </CardContent>
        </Card>
      </div>

      {/* Engineers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Engineers Overview
            </CardTitle>
            <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="busy">Busy</TabsTrigger>
                <TabsTrigger value="offline">Offline</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEngineers.map((engineer) => (
              <div key={engineer.id} className="border rounded-lg p-4 space-y-4">
                {/* Engineer Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>
                          {engineer.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getAvailabilityColor(engineer.availability)}`}
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">{engineer.full_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{engineer.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getAvailabilityBadge(engineer.availability)}>
                      {engineer.availability}
                    </Badge>
                    {onAssignTicket && engineer.availability === 'available' && (
                      <Button 
                        size="sm" 
                        onClick={() => onAssignTicket(engineer.id)}
                        className="gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        Assign
                      </Button>
                    )}
                  </div>
                </div>

                {/* Engineer Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {engineer.skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Workload */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Current Workload</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Capacity</span>
                        <span>{engineer.workload}%</span>
                      </div>
                      <Progress value={engineer.workload} className="h-2" />
                    </div>
                  </div>

                  {/* Performance */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Performance</h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Completion Rate:</span>
                        <span className="font-medium">{engineer.performance.completionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Resolution:</span>
                        <span className="font-medium">{engineer.performance.avgResolutionTime}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span className="font-medium">⭐ {engineer.performance.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket Status */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Assigned Tickets</h4>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold">{engineer.assignedTickets.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">{engineer.assignedTickets.open}</div>
                      <div className="text-xs text-muted-foreground">Open</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{engineer.assignedTickets.in_progress}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{engineer.assignedTickets.resolved}</div>
                      <div className="text-xs text-muted-foreground">Resolved</div>
                    </div>
                  </div>
                </div>

                {/* Last Active */}
                <div className="text-xs text-muted-foreground">
                  Last active: {engineer.lastActive.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
