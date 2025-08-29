import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import EnhancedMediaCapture from '../components/EnhancedMediaCapture';
import MediaCapture from '../components/MediaCapture';
import { 
  ArrowLeft, 
  Send, 
  AlertTriangle,
  Clock,
  MapPin,
  Wrench,
  Camera,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from '../components/ui/use-toast';

export default function CreateTicketPage() {

  const navigate = useNavigate();
  const { user } = useAuth();
  const { createTicket } = useTickets();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'fault',
    priority: 'medium',
    equipmentId: '',
    equipmentName: '',
    location: '',
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
   
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
     
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
   
      return;
   
    }
    
    setLoading(true);
    
    try {
   
      const ticketData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        location: formData.location,
        equipmentId: formData.equipmentId || undefined,
        // Add media files information
        metadata: {
          mediaFiles: mediaFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size
          }))
        }

      };

      const newTicket = await createTicket(ticketData);

      toast({
        title: 'Success',
        description: `Ticket created successfully${mediaFiles.length > 0 ? ' with ' + mediaFiles.length + ' media files' : ''}`,
      });

      navigate(`/tickets/${newTicket.id}`);

    } catch (error) {

      console.log(error)

      // console.error('Error creating ticket:', {
      //   message: error instanceof Error ? error.message : String(error),
      //   stack: error instanceof Error ? error.stack : undefined,
      //   formData: formData,
      //   component: 'CreateTicketPage',
      //   error: error
      // });

      toast({
        title: 'Error',
        description: 'Failed to create ticket. Please try again.',
        variant: 'destructive'
      });

    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
   
    if (navigator.geolocation) {
   
      navigator.geolocation.getCurrentPosition(
   
        (position) => {
   
          const { latitude, longitude } = position.coords;
   
          setCurrentLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
   
          setFormData(prev => ({ 
            ...prev, 
            location: prev.location || `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}` 
          }));
   
        },
   
        (error) => {
   
          console.error('Error getting location:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            component: 'CreateTicketPage',
            operation: 'getCurrentPosition',
            error: error
          });
   
          toast({
            title: 'Location Error',
            description: 'Unable to get current location',
            variant: 'destructive'
          });
   
        }
   
      );
   
    }

  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create Ticket</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the problem..."
                required
                rows={4}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fault">🔧 Fault</SelectItem>
                    <SelectItem value="maintenance">⚙️ Maintenance</SelectItem>
                    <SelectItem value="inspection">🔍 Inspection</SelectItem>
                    <SelectItem value="upgrade">⬆️ Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        Critical
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Badge className={cn("text-sm px-3 py-1", getPriorityColor(formData.priority))}>
                Current Priority: {formData.priority}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Equipment & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Equipment & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="equipmentId">Equipment ID</Label>
                <Input
                  id="equipmentId"
                  value={formData.equipmentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipmentId: e.target.value }))}
                  placeholder="e.g., GEN-001, PUMP-12"
                />
              </div>
              
              <div>
                <Label htmlFor="equipmentName">Equipment Name</Label>
                <Input
                  id="equipmentName"
                  value={formData.equipmentName}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipmentName: e.target.value }))}
                  placeholder="e.g., Generator Unit 1, Cooling Pump"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="location">Location *</Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Building, Floor, Room or coordinates"
                  required
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={getCurrentLocation}
                  className="flex-shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </div>
              {currentLocation && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current GPS: {currentLocation}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Media Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Media Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MediaCapture onMediaCapture={setMediaFiles} />
            {mediaFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground">
                  {mediaFiles.length} file(s) attached
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Ticket...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create Ticket
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
