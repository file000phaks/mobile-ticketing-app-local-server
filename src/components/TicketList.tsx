import React from 'react';
import { Ticket } from '../models/Ticket';
import TicketCard from './TicketCard';
import { ScrollArea } from './ui/scroll-area';

interface TicketListProps {
  tickets: Ticket[];
  onTicketSelect: (ticketId: string) => void;
  isAdmin: boolean;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, onTicketSelect, isAdmin }) => {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            📋
          </div>
        </div>
        <h3 className="text-lg font-medium mb-1">No tickets found</h3>
        <p className="text-muted-foreground">
          Create your first ticket to get started
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-3 pb-20">
        {tickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onClick={() => onTicketSelect(ticket.id)}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default TicketList;