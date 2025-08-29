import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DatePickerWithRange } from '../components/ui/date-picker';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Clock,
  Wrench,
  CheckCircle,
  Filter,
  Target,
  Compass,
  Calendar,
  Search,
  Settings,
  Layers,
  TrendingUp,
  Building,
  Zap,
  Monitor,
  Wifi,
  Database,
  Shield,
  RotateCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { addDays } from 'date-fns';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
  equipmentId?: string;
  equipmentType?: string;
  maintenanceStatus?: 'good' | 'needs_attention' | 'critical' | 'maintenance_due';
}

interface Equipment {
  id: string;
  name: string;
  type: 'server' | 'network' | 'power' | 'hvac' | 'security' | 'other';
  location: LocationData;
  status: 'operational' | 'warning' | 'error' | 'maintenance';
  lastMaintenance: string;
  nextMaintenance: string;
  ticketCount: number;
}

interface TicketCluster {
  id: string;
  center: LocationData;
  tickets: any[];
  radius: number; // in kilometers
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function MapPage() {

  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { tickets } = useTickets();
  const [selectedTab, setSelectedTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: addDays(new Date(), -30),
    to: new Date()
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'clusters' | 'heatmap'>('list');

  const isAdmin = profile?.role === 'admin';
  const isSupervisor = profile?.role === 'supervisor';
  const canViewAll = isAdmin || isSupervisor;

  // Mock equipment data
  const [equipment] = useState<Equipment[]>([
    {
      id: 'eq1',
      name: 'Main Server Rack A1',
      type: 'server',
      location: { lat: 40.7128, lng: -74.0060, address: 'Building A - Server Room' },
      status: 'operational',
      lastMaintenance: '2024-11-01',
      nextMaintenance: '2025-02-01',
      ticketCount: 2
    },
    {
      id: 'eq2',
      name: 'HVAC Unit North',
      type: 'hvac',
      location: { lat: 40.7589, lng: -73.9851, address: 'Building A - Roof North' },
      status: 'warning',
      lastMaintenance: '2024-10-15',
      nextMaintenance: '2024-12-15',
      ticketCount: 1
    },
    {
      id: 'eq3',
      name: 'Network Switch B2',
      type: 'network',
      location: { lat: 40.7505, lng: -73.9934, address: 'Building B - IT Room' },
      status: 'error',
      lastMaintenance: '2024-09-20',
      nextMaintenance: '2024-12-20',
      ticketCount: 3
    },
    {
      id: 'eq4',
      name: 'Power Distribution Panel',
      type: 'power',
      location: { lat: 40.7614, lng: -73.9776, address: 'Building A - Electrical Room' },
      status: 'maintenance',
      lastMaintenance: '2024-11-20',
      nextMaintenance: '2025-01-20',
      ticketCount: 0
    }
  ]);

  // Filter tickets based on user role
  const userTickets = canViewAll ? tickets : tickets.filter(ticket => 
    ticket.createdBy === user?.id || ticket.assignedTo === user?.id
  );

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  // Parse location coordinates with enhanced equipment mapping
  const parseLocation = (location: string): LocationData | null => {
    const coordMatch = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
        address: location
      };
    }
    
    // Enhanced location mapping including equipment
    const mockLocations: { [key: string]: LocationData } = {
      'Building A': { lat: 40.7128, lng: -74.0060, address: 'Building A - Main Facility' },
      'Building B': { lat: 40.7505, lng: -73.9934, address: 'Building B - Secondary Location' },
      'Power Plant': { lat: 40.7589, lng: -73.9851, address: 'Power Plant - Central Station' },
      'Server Room': { lat: 40.7128, lng: -74.0060, address: 'Building A - Server Room', equipmentType: 'server' },
      'Network Center': { lat: 40.7505, lng: -73.9934, address: 'Building B - Network Center', equipmentType: 'network' },
      'Electrical Room': { lat: 40.7614, lng: -73.9776, address: 'Building A - Electrical Room', equipmentType: 'power' }
    };
    
    for (const [key, coord] of Object.entries(mockLocations)) {
      if (location.toLowerCase().includes(key.toLowerCase())) {
        return coord;
      }
    }
    
    return null;
  };

  // Filter tickets with enhanced criteria
  const getFilteredTickets = () => {
    return userTickets.filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      
      // Date range filter
      const ticketDate = new Date(ticket.createdAt);
      const matchesDate = ticketDate >= dateRange.from && ticketDate <= dateRange.to;
      
      // Equipment filter
      const ticketLocation = parseLocation(ticket.location);
      const matchesEquipment = equipmentFilter === 'all' || 
        (ticketLocation?.equipmentType === equipmentFilter);
      
      return matchesSearch && matchesStatus && matchesPriority && matchesDate && matchesEquipment;
    });
  };

  // Filter equipment
  const getFilteredEquipment = () => {
    return equipment.filter(eq => {
      const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           eq.location.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = equipmentFilter === 'all' || eq.type === equipmentFilter;
      const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  // Create ticket clusters
  const createClusters = (tickets: any[]): TicketCluster[] => {
    const clusters: TicketCluster[] = [];
    const processed = new Set<string>();
    const clusterRadius = 0.5; // 500 meters

    tickets.forEach(ticket => {
      if (processed.has(ticket.id)) return;
      
      const ticketLocation = parseLocation(ticket.location);
      if (!ticketLocation) return;

      const cluster: TicketCluster = {
        id: `cluster_${ticket.id}`,
        center: ticketLocation,
        tickets: [ticket],
        radius: clusterRadius,
        priority: ticket.priority
      };

      // Find nearby tickets to add to this cluster
      tickets.forEach(otherTicket => {
        if (processed.has(otherTicket.id) || otherTicket.id === ticket.id) return;
        
        const otherLocation = parseLocation(otherTicket.location);
        if (!otherLocation) return;

        const distance = calculateDistance(
          ticketLocation.lat, ticketLocation.lng,
          otherLocation.lat, otherLocation.lng
        );

        if (distance <= clusterRadius) {
          cluster.tickets.push(otherTicket);
          processed.add(otherTicket.id);
          
          // Update cluster priority to highest priority in cluster
          const priorities = { low: 1, medium: 2, high: 3, critical: 4 };
          if ((priorities[otherTicket.priority] || 0) > (priorities[cluster.priority] || 0)) {
            cluster.priority = otherTicket.priority;
          }
        }
      });

      processed.add(ticket.id);
      clusters.push(cluster);
    });

    return clusters;
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-500 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-500 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Clock;
      case 'assigned': return Target;
      case 'in_progress': return Wrench;
      case 'resolved': case 'verified': case 'closed': return CheckCircle;
      default: return Clock;
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'server': return Database;
      case 'network': return Wifi;
      case 'power': return Zap;
      case 'hvac': return Building;
      case 'security': return Shield;
      default: return Monitor;
    }
  };

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'maintenance': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const openInMaps = (location: LocationData) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  const filteredTickets = getFilteredTickets();
  const filteredEquipment = getFilteredEquipment();
  const ticketClusters = createClusters(filteredTickets);

  // Sort tickets by distance if user location is available
  const sortedTickets = userLocation 
    ? filteredTickets
        .map(ticket => ({
          ...ticket,
          locationData: parseLocation(ticket.location),
          distance: (() => {
            const loc = parseLocation(ticket.location);
            return loc ? calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng) : null;
          })()
        }))
        .sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        })
    : filteredTickets.map(ticket => ({ ...ticket, locationData: parseLocation(ticket.location), distance: null }));

  const isOverdue = (ticket: any) => {
    return ticket.dueDate && 
           new Date(ticket.dueDate) < new Date() && 
           !['resolved', 'verified', 'closed'].includes(ticket.status);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          Field Operations Map
        </h1>
        <p className="text-muted-foreground">
          Navigate tickets, track equipment, and manage field operations
        </p>
      </div>

      {/* Current Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Your Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locationError ? (
            <div className="text-center py-4">
              <Compass className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{locationError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Retry Location
              </Button>
            </div>
          ) : userLocation ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Position</p>
                <p className="text-xs text-muted-foreground">{userLocation.address}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openInMaps(userLocation)}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Open in Maps
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Getting your location...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tickets or equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
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
            
            <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Equipment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Equipment</SelectItem>
                <SelectItem value="server">Servers</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="power">Power</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="text-xs">
                <Layers className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="clusters">Clusters</SelectItem>
                <SelectItem value="heatmap">Heat Map</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets">
            Tickets ({filteredTickets.length})
          </TabsTrigger>
          <TabsTrigger value="equipment">
            Equipment ({filteredEquipment.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          {viewMode === 'clusters' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Ticket Clusters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {ticketClusters.map((cluster) => (
                    <Card key={cluster.id} className={cn("border-l-4", getPriorityColor(cluster.priority))}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">
                            Cluster: {cluster.center.address}
                          </h4>
                          <Badge className={cn("text-xs", getPriorityColor(cluster.priority))}>
                            {cluster.priority} • {cluster.tickets.length} tickets
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {cluster.tickets.slice(0, 3).map((ticket) => (
                            <div key={ticket.id} className="text-sm text-muted-foreground">
                              • {ticket.title}
                            </div>
                          ))}
                          {cluster.tickets.length > 3 && (
                            <div className="text-sm text-muted-foreground">
                              ... and {cluster.tickets.length - 3} more
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => openInMaps(cluster.center)}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Navigate to Area
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sortedTickets.length === 0 ? (
                <div className="col-span-full">
                  <Card className="p-8 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No tickets found</h3>
                    <p className="text-muted-foreground mb-4">
                      No tickets match your current filters
                    </p>
                    <Button onClick={() => navigate('/create')}>
                      Create New Ticket
                    </Button>
                  </Card>
                </div>
              ) : (
                sortedTickets.map((ticket) => {
                  const StatusIcon = getStatusIcon(ticket.status);
                  const hasLocation = ticket.locationData !== null;
                  const ticketIsOverdue = isOverdue(ticket);
                  
                  return (
                    <Card 
                      key={ticket.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md border-l-4",
                        getPriorityColor(ticket.priority),
                        selectedTicket === ticket.id && "ring-2 ring-primary",
                        ticketIsOverdue && "border-t-4 border-t-orange-500"
                      )}
                      onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-medium text-sm leading-tight flex-1">
                              {ticket.title}
                              {ticketIsOverdue && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </h3>
                            <div className="flex gap-1">
                              <Badge variant="secondary" className="text-xs">
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{ticket.location}</span>
                            </div>
                            {ticket.distance !== null && (
                              <span className="flex-shrink-0">
                                {ticket.distance < 1 
                                  ? `${Math.round(ticket.distance * 1000)}m` 
                                  : `${ticket.distance.toFixed(1)}km`
                                }
                              </span>
                            )}
                          </div>

                          {ticket.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>Due: {new Date(ticket.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}

                          {selectedTicket === ticket.id && (
                            <div className="space-y-2 pt-2 border-t">
                              <p className="text-sm text-muted-foreground">{ticket.description}</p>
                              <div className="grid grid-cols-2 gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/tickets/${ticket.id}`);
                                  }}
                                >
                                  View Details
                                </Button>
                                {hasLocation ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openInMaps(ticket.locationData!);
                                    }}
                                  >
                                    <Navigation className="w-3 h-3 mr-1" />
                                    Navigate
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled
                                    className="text-muted-foreground"
                                  >
                                    No GPS Data
                                  </Button>
                                )}
                              </div>
                              {hasLocation && ticket.locationData && (
                                <p className="text-xs text-muted-foreground">
                                  📍 {ticket.locationData.lat.toFixed(6)}, {ticket.locationData.lng.toFixed(6)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipment.map((eq) => {
              const EquipmentIcon = getEquipmentIcon(eq.type);
              const isMaintenanceDue = new Date(eq.nextMaintenance) <= addDays(new Date(), 7);
              
              return (
                <Card 
                  key={eq.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedEquipment === eq.id && "ring-2 ring-primary",
                    isMaintenanceDue && "border-l-4 border-l-yellow-500"
                  )}
                  onClick={() => setSelectedEquipment(selectedEquipment === eq.id ? null : eq.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <EquipmentIcon className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-medium text-sm">{eq.name}</h3>
                      </div>
                      <Badge className={cn("text-xs", getEquipmentStatusColor(eq.status))}>
                        {eq.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-3">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{eq.location.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{eq.ticketCount} open tickets</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Next: {new Date(eq.nextMaintenance).toLocaleDateString()}</span>
                        {isMaintenanceDue && (
                          <Badge variant="outline" className="ml-1 text-xs">
                            Due Soon
                          </Badge>
                        )}
                      </div>
                    </div>

                    {selectedEquipment === eq.id && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          <div>Last Maintenance: {new Date(eq.lastMaintenance).toLocaleDateString()}</div>
                          <div>Equipment Type: {eq.type.charAt(0).toUpperCase() + eq.type.slice(1)}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/create?equipment=${eq.id}&location=${eq.location.address}`);
                            }}
                          >
                            Report Issue
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openInMaps(eq.location);
                            }}
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            Navigate
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Hotspot Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Building A</span>
                    <span className="font-bold">12 tickets</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Building B</span>
                    <span className="font-bold">8 tickets</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Power Plant</span>
                    <span className="font-bold">5 tickets</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Equipment Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Operational</span>
                    <span className="font-bold text-green-600">
                      {equipment.filter(e => e.status === 'operational').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Warning</span>
                    <span className="font-bold text-yellow-600">
                      {equipment.filter(e => e.status === 'warning').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Error</span>
                    <span className="font-bold text-red-600">
                      {equipment.filter(e => e.status === 'error').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-medium">This Week</div>
                    <div className="text-muted-foreground">
                      {equipment.filter(e => {
                        const nextMaint = new Date(e.nextMaintenance);
                        const weekFromNow = addDays(new Date(), 7);
                        return nextMaint <= weekFromNow && nextMaint >= new Date();
                      }).length} items
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Next Month</div>
                    <div className="text-muted-foreground">
                      {equipment.filter(e => {
                        const nextMaint = new Date(e.nextMaintenance);
                        const monthFromNow = addDays(new Date(), 30);
                        const weekFromNow = addDays(new Date(), 7);
                        return nextMaint <= monthFromNow && nextMaint > weekFromNow;
                      }).length} items
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
