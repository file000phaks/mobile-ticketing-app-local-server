import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, MapPin, AlertTriangle, User } from 'lucide-react';
import { Ticket } from '../models/Ticket';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
  isAdmin: boolean;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
};

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick, isAdmin }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 card-elevated border-l-4 border-l-primary"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base font-semibold truncate flex-1">
            {ticket.title}
          </CardTitle>
          <div className="flex gap-1 flex-shrink-0">
            <Badge className={`text-xs ${priorityColors[ticket.priority]}`}>
              {ticket.priority}
            </Badge>
            <Badge className={`text-xs ${statusColors[ticket.status]}`}>
              {ticket.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {ticket.description}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{ticket.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="truncate">{ticket.createdByProfile.fullName || 'Unknown'}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketCard;