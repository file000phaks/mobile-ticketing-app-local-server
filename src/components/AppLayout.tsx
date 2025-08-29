import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Button } from './ui/button';
import { Bell, Search, Settings } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useAuth } from '../hooks/useAuth';
import { useTickets } from '../hooks/useTickets';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { cn } from '../lib/utils';
import ThemeToggle from './ThemeToggle';
import OfflineIndicator from './OfflineIndicator';
import NotificationBell from './NotificationBell';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { profile } = useAuth();
  const { tickets } = useTickets();
  const isOnline = useOnlineStatus();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const criticalTickets = tickets.filter(t => t.priority === 'critical').length;
  const highPriorityTickets = tickets.filter(t => t.priority === 'high').length;

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Search */}
            <div className={cn(
              "transition-all duration-300 ease-in-out",
              showSearch ? "flex-1 max-w-md" : "w-auto"
            )}>
              {showSearch ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search tickets, equipment, locations..."
                    className="pl-10 pr-4"
                    onBlur={() => setShowSearch(false)}
                    autoFocus
                  />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(true)}
                  className="gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden md:inline">Search</span>
                </Button>
              )}
            </div>

            {/* Priority Alerts */}
            {(criticalTickets > 0 || highPriorityTickets > 0) && (
              <div className="hidden md:flex items-center gap-2">
                {criticalTickets > 0 && (
                  <Badge variant="destructive" className="gap-1 animate-pulse">
                    <span className="w-2 h-2 bg-current rounded-full"></span>
                    {criticalTickets} Critical
                  </Badge>
                )}
                {highPriorityTickets > 0 && (
                  <Badge variant="default" className="gap-1">
                    <span className="w-2 h-2 bg-current rounded-full"></span>
                    {highPriorityTickets} High
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <OfflineIndicator />
            <NotificationBell />
            <ThemeToggle />
            
            {/* User Info */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l">
              <div className="text-right">
                <p className="text-sm font-medium leading-none">
                  {profile?.fullName || profile?.email || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.role?.replace('_', ' ') || 'Field Engineer'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>

        {/* Status Bar */}
        <div className="h-6 bg-muted/30 border-t flex items-center justify-between px-4 text-xs text-muted-foreground flex-shrink-0">
          <div className="flex items-center gap-4">
            <span>Tickets: {tickets.length}</span>
            <span>•</span>
            <span>Status: {isOnline ? 'Online' : 'Offline'}</span>
            {!isOnline && (
              <>
                <span>•</span>
                <span className="text-orange-600">Running in offline mode</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span>v1.0.0</span>
          </div>
        </div>
      </div>

      {/* Mobile overlay when sidebar is open */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}
