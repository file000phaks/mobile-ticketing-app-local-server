import React, { useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useUserRole } from '../hooks/useUserRole';
import { useAuth } from '../hooks/useAuth';
import CreateTicketForm from './CreateTicketForm';
import TicketList from './TicketList';
import TicketDetail from './TicketDetail';
import Dashboard from './Dashboard';
import AdminBadge from './AdminBadge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Plus, List, BarChart3, Search, User } from 'lucide-react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';

export default function MobileTicketApp() {
 
  const { tickets, createTicket, updateTicket, deleteTicket } = useTickets();
  const { profile } = useAuth();
  const isOnline = useOnlineStatus();
  const { userRole, loading: roleLoading } = useUserRole();
  const [activeView, setActiveView] = useState<'dashboard' | 'list' | 'create' | 'detail'>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isAdmin = userRole === 'admin';
  
  // Filter tickets based on user role
  const userTickets = isAdmin ? tickets : tickets.filter(ticket => ticket.createdBy === profile.id);
  
  const filteredTickets = userTickets.filter(ticket => {
    
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  
  });

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveView('detail');
  };

  const handleTicketUpdate = (ticketId: string, updates: any) => {
    updateTicket(ticketId, updates);
  };

  const handleTicketDelete = (ticketId: string) => {
    deleteTicket(ticketId);
    setActiveView('list');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard tickets={filteredTickets} />;
      case 'create':
        return (
          <CreateTicketForm
            onSubmit={(data) => {
              createTicket(data);
              setActiveView('list');
            }}
            onCancel={() => setActiveView('dashboard')}
          />
        );
      case 'detail':
        const selectedTicket = tickets.find(t => t.id === selectedTicketId);
        if (!selectedTicket) return <div>Ticket not found</div>;
        return (
          <TicketDetail
            ticket={selectedTicket}
            onUpdate={handleTicketUpdate}
            onDelete={isAdmin ? handleTicketDelete : undefined}
            onBack={() => setActiveView('list')}
            isAdmin={isAdmin}
          />
        );
      case 'list':
      default:
        return (
          <div className="space-y-4 pb-20">
            <Card className="card-elevated p-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input-enhanced"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="input-enhanced">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
            <TicketList
              tickets={filteredTickets}
              onTicketSelect={handleTicketSelect}
              isAdmin={isAdmin}
            />
          </div>
        );
    }
  };

  if (roleLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="p-4 space-y-4">
        {/* Header with user info */}
        <Card className="card-elevated p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">Welcome Back</h2>
                <p className="text-sm text-muted-foreground">Equipment Manager</p>
              </div>
            </div>
            {isAdmin && <AdminBadge />}
          </div>
        </Card>

        {/* Offline indicator */}
        {!isOnline && (
          <Badge variant="destructive" className="w-full justify-center py-2">
            Offline Mode - Changes will sync when reconnected
          </Badge>
        )}
        
        <div className="pb-20">
          {renderContent()}
        </div>
        
        {/* Bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t p-4 shadow-lg">
          <div className="max-w-md mx-auto flex justify-around">
            <Button
              variant={activeView === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('dashboard')}
              className="flex-1 mx-1"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeView === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('list')}
              className="flex-1 mx-1"
            >
              <List className="w-4 h-4 mr-2" />
              Tickets
            </Button>
            <Button
              variant={activeView === 'create' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('create')}
              className="flex-1 mx-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}