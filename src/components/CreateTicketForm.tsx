import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Send } from 'lucide-react';

interface CreateTicketFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function CreateTicketForm({ onSubmit, onCancel }: CreateTicketFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'fault',
    priority: 'medium',
    equipment_id: '',
    equipment_name: '',
    location: '',
    reported_by: ''
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const ticketData = {
        ...formData,
        media_urls: mediaFiles.map(f => f.name),
        status: 'open',
        created_at: new Date().toISOString()
      };
      
      onSubmit(ticketData);
    } catch (error) {
      console.error('Error creating ticket:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        formData: formData,
        component: 'CreateTicketForm',
        error: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full max-h-screen overflow-hidden flex flex-col">
      <Card className="card-elevated flex-1 flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-lg">Create New Ticket</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                required
                className="input-enhanced"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the problem"
                required
                className="input-enhanced min-h-[80px] resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="input-enhanced">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fault">Fault</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="input-enhanced">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipment_id">Equipment ID</Label>
                <Input
                  id="equipment_id"
                  value={formData.equipment_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment_id: e.target.value }))}
                  placeholder="EQ-001"
                  className="input-enhanced"
                />
              </div>
              
              <div>
                <Label htmlFor="equipment_name">Equipment Name</Label>
                <Input
                  id="equipment_name"
                  value={formData.equipment_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment_name: e.target.value }))}
                  placeholder="Generator Unit 1"
                  required
                  className="input-enhanced"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Building, Floor, Room"
                  required
                  className="input-enhanced"
                />
              </div>
              
              <div>
                <Label htmlFor="reported_by">Reported By</Label>
                <Input
                  id="reported_by"
                  value={formData.reported_by}
                  onChange={(e) => setFormData(prev => ({ ...prev, reported_by: e.target.value }))}
                  placeholder="Your name"
                  required
                  className="input-enhanced"
                />
              </div>
            </div>
            
            <div>
              <Label>Media Attachments</Label>
            </div>
            
            <div className="sticky bottom-0 bg-background pt-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
