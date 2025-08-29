import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  BarChart3,
  List,
  Plus,
  Map,
  User,
  Users,
  Bell
} from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

export default function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tickets } = useTickets();
  const { profile } = useAuth();
  
  // Count unread notifications (open + high priority tickets)
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const urgentTickets = tickets.filter(t => t.priority === 'critical' || t.priority === 'high').length;
  const isAdminOrSupervisor = profile && ['admin', 'supervisor'].includes(profile.role);

  // Base navigation items for all users
  const baseNavItems = [
    {
      path: '/',
      icon: BarChart3,
      label: 'Dashboard',
      badge: urgentTickets > 0 ? urgentTickets : undefined
    },
    {
      path: '/tickets',
      icon: List,
      label: 'Tickets',
      badge: openTickets > 0 ? openTickets : undefined
    },
    {
      path: '/create',
      icon: Plus,
      label: 'Create',
      isCreate: true
    },
    {
      path: '/map',
      icon: Map,
      label: 'Map'
    }
  ];

  // Admin/Supervisor specific navigation
  const adminNavItems = [
    {
      path: '/',
      icon: BarChart3,
      label: 'Dashboard',
      badge: urgentTickets > 0 ? urgentTickets : undefined
    },
    {
      path: '/tickets',
      icon: List,
      label: 'Tickets',
      badge: openTickets > 0 ? openTickets : undefined
    },
    {
      path: '/engineers',
      icon: Users,
      label: 'Engineers'
    },
    {
      path: '/map',
      icon: Map,
      label: 'Map'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile'
    }
  ];

  // Regular field engineer navigation
  const fieldNavItems = [
    ...baseNavItems,
    {
      path: '/profile',
      icon: User,
      label: 'Profile'
    }
  ];

  const navItems = isAdminOrSupervisor ? adminNavItems : fieldNavItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t shadow-lg z-40">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex-1 mx-0.5 relative h-12 flex-col gap-1 px-2",
                  item.isCreate && "bg-primary text-primary-foreground hover:bg-primary/90",
                  isActive && !item.isCreate && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
