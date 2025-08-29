import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { 
  Users, 
  MapPin, 
  Clock, 
  UserCheck, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { toast } from './ui/use-toast';

interface TicketAssignmentProps {
  ticketId: string;
  currentAssignee?: string;
  ticketLocation?: string;
  onAssigned?: () => void;
}

interface Engineer {
  id: string;
  full_name: string;
  email: string;
  location?: string;
  assignedTickets: number;
  availability: 'available' | 'busy' | 'offline';
  skills: string[];
  distance?: number; // km from ticket location
}

export default function TicketAssignment({ 
  ticketId, 
  currentAssignee, 
  ticketLocation,
  onAssigned 
}: TicketAssignmentProps) {

  const { assignTicket } = useTickets();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState<string>(currentAssignee || '');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEngineers, setLoadingEngineers] = useState(true);

  // Mock engineer data with availability and skills
  const mockEngineers: Engineer[] = [
    {
      id: '3',
      full_name: 'Field Engineer',
      email: 'engineer@test.com',
      location: 'Building A - Zone 1',
      assignedTickets: 2,
      availability: 'available',
      skills: ['HVAC', 'Electrical', 'Plumbing'],
      distance: 0.5
    },
    {
      id: '4',
      full_name: 'Senior Technician',
      email: 'senior@test.com',
      location: 'Building B - Zone 2',
      assignedTickets: 4,
      availability: 'busy',
      skills: ['HVAC', 'Mechanical', 'Fire Safety'],
      distance: 1.2
    },
    {
      id: '5',
      full_name: 'Maintenance Specialist',
      email: 'maintenance@test.com',
      location: 'Building C - Zone 3',
      assignedTickets: 1,
      availability: 'available',
      skills: ['Electrical', 'Security Systems'],
      distance: 2.1
    },
    {
      id: '6',
      full_name: 'Equipment Expert',
      email: 'expert@test.com',
      location: 'Building A - Zone 2',
      assignedTickets: 3,
      availability: 'available',
      skills: ['HVAC', 'Elevators', 'Generators'],
      distance: 0.8
    }
  ];

  useEffect(() => {

    // Simulate loading engineers

    const loadEngineers = async () => {

      setLoadingEngineers(true);

      try {

        // In a real app, this would fetch from API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Sort by distance and availability
        const sortedEngineers = [...mockEngineers].sort((a, b) => {

          // Prioritize available engineers
          if (a.availability === 'available' && b.availability !== 'available') return -1;
          if (b.availability === 'available' && a.availability !== 'available') return 1;
          
          // Then sort by distance
          return (a.distance || 999) - (b.distance || 999);

        });
        
        setEngineers(sortedEngineers);

      } catch (error) {

        console.error('Error loading engineers:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          component: 'TicketAssignment',
          operation: 'loadEngineers',
          error: error
        });
        
      } finally {

        setLoadingEngineers(false);

      }

    };

    loadEngineers();

  }, [ticketLocation]);

  const handleAssign = async () => {
   
    if (!selectedEngineer) {
   
      toast({
        title: 'No engineer selected',
        description: 'Please select an engineer to assign the ticket to.',
        variant: 'destructive'
      });
   
      return;
   
    }

    setLoading(true);

    const engineer = engineers.find(e => e.id === selectedEngineer);
   
    try {
   
      await assignTicket(ticketId, selectedEngineer);
   
      toast({
        title: 'Ticket assigned',
        description: `Ticket has been assigned to ${engineer?.full_name || 'engineer'}.`,
      });

      onAssigned?.();
   
    } catch (error) {

      console.error('Error assigning ticket:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ticketId: ticketId,
        engineerId: selectedEngineer,
        component: 'TicketAssignment',
        error: error
      });

      toast({
        title: 'Assignment failed',
        description: 'Failed to assign ticket. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Assign Engineer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingEngineers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading engineers...</span>
          </div>
        ) : (
          <>
            {/* Engineer Selection */}
            <div className="space-y-3">
              <Label>Available Engineers</Label>
              
              {engineers.map((engineer) => (
                <div
                  key={engineer.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedEngineer === engineer.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedEngineer(engineer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {engineer.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getAvailabilityColor(engineer.availability)}`}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{engineer.full_name}</span>
                          <Badge 
                            variant={engineer.availability === 'available' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {engineer.availability}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{engineer.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{engineer.assignedTickets} tickets</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 mt-1">
                          {engineer.skills.slice(0, 3).map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {engineer.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{engineer.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {engineer.distance ? `${engineer.distance}km` : 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">distance</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Assignment Note */}
            <div className="space-y-2">
              <Label htmlFor="assignmentNote">Assignment Note (Optional)</Label>
              <Textarea
                id="assignmentNote"
                placeholder="Add any specific instructions or notes for the assigned engineer..."
                value={assignmentNote}
                onChange={(e) => setAssignmentNote(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleAssign}
                disabled={!selectedEngineer || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign Ticket
                  </>
                )}
              </Button>
            </div>

            {/* Assignment Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Assignment Tips:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Engineers are sorted by availability and distance</li>
                    <li>• Green dot = Available, Yellow = Busy, Red = Offline</li>
                    <li>• Consider skill match for complex equipment issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
