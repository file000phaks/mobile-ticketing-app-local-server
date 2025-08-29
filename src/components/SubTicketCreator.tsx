import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Plus, 
  AlertTriangle,
  Wrench,
  Zap,
  Clock,
  Loader2,
  FileText
} from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../hooks/useAuth';
import { toast } from './ui/use-toast';

interface SubTicketCreatorProps {
  parentTicketId: string;
  parentTicketTitle: string;
  onSubTicketCreated?: (subTicket: any) => void;
}

export default function SubTicketCreator({ 
  parentTicketId, 
  parentTicketTitle,
  onSubTicketCreated 
}: SubTicketCreatorProps) {
  const { createTicket } = useTickets();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'maintenance_issue',
    priority: 'medium',
    issueCategory: 'unexpected_problem'
  });

  const issueCategories = [
    { value: 'unexpected_problem', label: 'Unexpected Problem', icon: AlertTriangle },
    { value: 'additional_work', label: 'Additional Work Required', icon: Wrench },
    { value: 'safety_concern', label: 'Safety Concern', icon: Zap },
    { value: 'part_needed', label: 'Parts/Equipment Needed', icon: FileText },
    { value: 'specialist_required', label: 'Specialist Required', icon: Clock }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
   
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const subTicketData = {
        title: `[SUB] ${formData.title}`,
        description: `**Sub-ticket of:** ${parentTicketTitle}\n**Parent Ticket ID:** ${parentTicketId}\n**Issue Category:** ${issueCategories.find(c => c.value === formData.issueCategory)?.label}\n\n**Details:**\n${formData.description}`,
        type: formData.type,
        priority: formData.priority,
        location: 'Same as parent ticket', // Inherit from parent
        metadata: {
          isSubTicket: true,
          parentTicketId: parentTicketId,
          issueCategory: formData.issueCategory
        }
      };
      
      const newSubTicket = await createTicket(subTicketData);
      
      toast({
        title: 'Sub-ticket created',
        description: `Sub-ticket "${formData.title}" has been created successfully.`,
      });

      // Reset form and close dialog
      setFormData({
        title: '',
        description: '',
        type: 'maintenance_issue',
        priority: 'medium',
        issueCategory: 'unexpected_problem'
      });
      setOpen(false);
      
      onSubTicketCreated?.(newSubTicket);
      
    } catch (error) {
      console.error('Error creating sub-ticket:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        parentTicketId: parentTicketId,
        component: 'SubTicketCreator',
        error: error
      });
      toast({
        title: 'Error',
        description: 'Failed to create sub-ticket. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = issueCategories.find(c => c.value === formData.issueCategory);
  const CategoryIcon = selectedCategory?.icon || AlertTriangle;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Create Sub-Ticket
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Sub-Ticket
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Report an issue that arose during maintenance of: <strong>{parentTicketTitle}</strong>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Category */}
          <div className="space-y-3">
            <Label>Issue Category</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {issueCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.issueCategory === category.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, issueCategory: category.value }))}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{category.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Additional wiring required, Safety hazard found..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the issue in detail, including what you were doing when it occurred, what needs to be addressed, and any safety concerns..."
              rows={4}
              required
            />
          </div>

          {/* Priority and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance_issue">Maintenance Issue</SelectItem>
                  <SelectItem value="safety_concern">Safety Concern</SelectItem>
                  <SelectItem value="additional_work">Additional Work</SelectItem>
                  <SelectItem value="inspection">Inspection Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CategoryIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Sub-Ticket Information</p>
                <ul className="text-xs space-y-1">
                  <li>• This sub-ticket will be linked to the parent ticket</li>
                  <li>• It will inherit the location from the parent ticket</li>
                  <li>• Both tickets will appear in the tickets list</li>
                  <li>• Sub-tickets help track complex maintenance issues</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.description.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Sub-Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
