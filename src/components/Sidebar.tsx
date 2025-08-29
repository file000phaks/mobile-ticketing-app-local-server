import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  BarChart3, 
  List, 
  Plus, 
  Map, 
  User,
  Users,
  Archive,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Shield,
  Target,
  Wrench,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {

  const location = useLocation();
  const navigate = useNavigate();
  const { tickets } = useTickets();
  const { profile, signOut } = useAuth();

  /**
   * Handles user sign out and navigates to sign-in page
   */
  const handleSignOut = async () => {
   
    try {
   
      await signOut();
   
    } catch (error) {
   
      console.error('Sign out error:', error);
   
    }
  
  };

  const isAdmin = profile?.role === 'admin';
  const isSupervisor = profile?.role === 'supervisor';
  const isAdminOrSupervisor = isAdmin || isSupervisor;

  // Count notifications and tickets
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const urgentTickets = tickets.filter(t => t.priority === 'critical' || t.priority === 'high').length;
  const assignedTickets = tickets.filter(t => t.assignedTo === profile?.id).length;
  const overdueTickets = tickets.filter(t => 
    t.dueDate && 
    new Date(t.dueDate) < new Date() && 
    !['resolved', 'verified', 'closed'].includes(t.status)
  ).length;

  const mainNavItems = [
    {
      path: '/',
      icon: BarChart3,
      label: 'Dashboard',
      badge: urgentTickets > 0 ? urgentTickets : undefined,
      description: 'Overview and metrics'
    },
    {
      path: '/tickets',
      icon: List,
      label: 'Tickets',
      badge: openTickets > 0 ? openTickets : undefined,
      description: 'Manage tickets'
    },
    {
      path: '/create',
      icon: Plus,
      label: 'Create',
      isCreate: true,
      description: 'New ticket'
    },
    {
      path: '/map',
      icon: Map,
      label: 'Field Map',
      description: 'Location-based view'
    }
  ];

  const adminNavItems = [
    {
      path: '/engineers',
      icon: Users,
      label: 'Engineers',
      description: 'Team management',
      adminOnly: true
    },
    {
      path: '/admin/supervisors',
      icon: Shield,
      label: 'Supervisors',
      description: 'Supervisor management',
      adminOnly: true
    },
    {
      path: '/admin/users',
      icon: Activity,
      label: 'All Users',
      description: 'Complete user management',
      adminOnly: true
    },
    // {
    //   path: '/admin/resolved-tickets',
    //   icon: Archive,
    //   label: 'Resolved Tickets',
    //   description: 'Ticket history & analytics',
    //   adminOnly: true
    // },
    {
      path: '/admin/system',
      icon: Wrench,
      label: 'System Tools',
      description: 'System maintenance & tools',
      adminOnly: true
    },
    {
      path: '/admin/settings',
      icon: Settings,
      label: 'Settings',
      description: 'System settings',
      adminOnly: true
    }
  ];

  const quickActions = [
    {
      icon: Target,
      label: 'My Tasks',
      badge: assignedTickets,
      onClick: () => navigate('/tickets?assignedTo=' + profile?.id),
      color: 'text-blue-600'
    },
    {
      icon: AlertTriangle,
      label: 'Overdue',
      badge: overdueTickets,
      onClick: () => navigate('/tickets?overdue=true'),
      color: overdueTickets > 0 ? 'text-red-600' : 'text-gray-400'
    },
    {
      icon: Clock,
      label: 'Recent',
      onClick: () => navigate('/tickets?sort=recent'),
      color: 'text-green-600'
    },
    {
      icon: TrendingUp,
      label: 'Analytics',
      onClick: () => navigate('/?view=analytics'),
      color: 'text-purple-600'
    }
  ];

  const NavItem = ({ item, isActive, showLabel = true }) => {
    
    const Icon = item.icon;
    
    const button = (
      <Button
        variant={isActive ? 'default' : 'ghost'}
        onClick={() => navigate(item.path)}
        className={cn(
          "w-full justify-start gap-3 h-12",
          collapsed && "px-3 justify-center",
          item.isCreate && "bg-primary text-primary-foreground hover:bg-primary/90",
          isActive && !item.isCreate && "bg-primary/10 text-primary hover:bg-primary/20"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {showLabel && !collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge 
                variant="destructive" 
                className="ml-auto h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {item.badge > 99 ? '99+' : item.badge}
              </Badge>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {item.badge > 99 ? '99+' : item.badge}
          </Badge>
        )}
      </Button>
    );

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="destructive" className="h-5 min-w-5 rounded-full p-0 text-xs">
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  const QuickActionItem = ({ action }) => {
    const Icon = action.icon;
    
    const button = (
      <Button
        variant="ghost"
        onClick={action.onClick}
        className={cn(
          "w-full justify-start gap-3 h-10 relative",
          collapsed && "px-3 justify-center"
        )}
      >
        <Icon className={cn("w-4 h-4 flex-shrink-0", action.color)} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-sm">{action.label}</span>
            {action.badge !== undefined && action.badge > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-auto h-4 min-w-4 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {action.badge > 99 ? '99+' : action.badge}
              </Badge>
            )}
          </>
        )}
        {collapsed && action.badge !== undefined && action.badge > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {action.badge > 99 ? '99+' : action.badge}
          </Badge>
        )}
      </Button>
    );

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span>{action.label}</span>
              {action.badge !== undefined && action.badge > 0 && (
                <Badge variant="secondary" className="h-4 min-w-4 rounded-full p-0 text-xs">
                  {action.badge > 99 ? '99+' : action.badge}
                </Badge>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  };

  return (
    <div className={cn(
      "bg-card border-r flex flex-col transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm">Field Portal</h2>
              <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
                {isAdmin ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                {isAdmin ? 'Admin' : isSupervisor ? 'Supervisor' : 'Engineer'}
              </Badge>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!collapsed && <h3 className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Navigation</h3>}
            {mainNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavItem key={item.path} item={item} isActive={isActive} />
              );
            })}
          </div>

          {/* Admin Navigation */}
          {isAdminOrSupervisor && (
            <>
              <Separator className="my-3" />
              <div className="space-y-1">
                {!collapsed && <h3 className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Management</h3>}
                {adminNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavItem key={item.path} item={item} isActive={isActive} />
                  );
                })}
              </div>
            </>
          )}

          {/* Quick Actions */}
          <Separator className="my-3" />
          <div className="space-y-1">
            {!collapsed && <h3 className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Actions</h3>}
            {quickActions.map((action, index) => (
              <QuickActionItem key={index} action={action} />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t space-y-1">
        <NavItem 
          item={{
            path: '/profile',
            icon: User,
            label: 'Profile',
            description: 'User settings'
          }}
          isActive={location.pathname === '/profile'}
        />
        
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start gap-3 h-12 text-red-600 hover:text-red-700 hover:bg-red-50",
            collapsed && "px-3 justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}
