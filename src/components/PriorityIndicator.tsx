import React from 'react';
import { Badge } from './ui/badge';
import { AlertTriangle, Clock, Calendar, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface PriorityIndicatorProps {
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: string;
  status?: string;
  className?: string;
  showIcon?: boolean;
  showSLA?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PriorityIndicator({ 
  priority, 
  dueDate, 
  status, 
  className, 
  showIcon = true, 
  showSLA = true,
  size = 'md' 
}: PriorityIndicatorProps) {
  
  const isOverdue = dueDate && new Date(dueDate) < new Date() && !['resolved', 'verified', 'closed'].includes(status || '');
  const isUrgent = priority === 'critical' || isOverdue;
  
  const getDueDateStatus = () => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (isOverdue) {
      return { status: 'overdue', label: 'Overdue', color: 'destructive' };
    } else if (hoursUntilDue <= 2) {
      return { status: 'due-soon', label: 'Due Soon', color: 'destructive' };
    } else if (hoursUntilDue <= 24) {
      return { status: 'due-today', label: 'Due Today', color: 'default' };
    } else if (hoursUntilDue <= 48) {
      return { status: 'due-tomorrow', label: 'Due Tomorrow', color: 'secondary' };
    }
    
    return null;
  };

  const getPriorityConfig = () => {
    switch (priority) {
      case 'critical':
        return {
          color: 'bg-red-600 text-white border-red-600',
          icon: Zap,
          label: 'Critical',
          bgClass: 'bg-red-50 dark:bg-red-950/20',
          borderClass: 'border-l-red-500'
        };
      case 'high':
        return {
          color: 'bg-orange-500 text-white border-orange-500',
          icon: AlertTriangle,
          label: 'High',
          bgClass: 'bg-orange-50 dark:bg-orange-950/20',
          borderClass: 'border-l-orange-500'
        };
      case 'medium':
        return {
          color: 'bg-yellow-500 text-white border-yellow-500',
          icon: Clock,
          label: 'Medium',
          bgClass: 'bg-yellow-50 dark:bg-yellow-950/20',
          borderClass: 'border-l-yellow-500'
        };
      case 'low':
        return {
          color: 'bg-green-500 text-white border-green-500',
          icon: Calendar,
          label: 'Low',
          bgClass: 'bg-green-50 dark:bg-green-950/20',
          borderClass: 'border-l-green-500'
        };
      default:
        return {
          color: 'bg-gray-500 text-white border-gray-500',
          icon: Clock,
          label: 'Normal',
          bgClass: 'bg-gray-50 dark:bg-gray-950/20',
          borderClass: 'border-l-gray-500'
        };
    }
  };

  const priorityConfig = getPriorityConfig();
  const dueDateStatus = getDueDateStatus();
  const PriorityIcon = priorityConfig.icon;

  const sizeClasses = {
    sm: 'text-xs h-5',
    md: 'text-sm h-6',
    lg: 'text-base h-8'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Priority Badge */}
      <Badge 
        className={cn(
          priorityConfig.color,
          sizeClasses[size],
          isUrgent && "animate-pulse",
          "font-medium shadow-sm"
        )}
      >
        {showIcon && <PriorityIcon className={cn(iconSizes[size], "mr-1")} />}
        {priorityConfig.label}
      </Badge>

      {/* SLA/Due Date Indicator */}
      {showSLA && dueDateStatus && (
        <Badge 
          variant={dueDateStatus.color as any}
          className={cn(
            sizeClasses[size],
            dueDateStatus.status === 'overdue' && "animate-pulse",
            "font-medium"
          )}
        >
          <Clock className={cn(iconSizes[size], "mr-1")} />
          {dueDateStatus.label}
        </Badge>
      )}

      {/* Visual Priority Bar */}
      {priority === 'critical' && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-6 bg-red-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-3 bg-red-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}
    </div>
  );
}

// Helper component for full priority context
export function PriorityContext({ priority, dueDate, status, className }: PriorityIndicatorProps) {
  const priorityConfig = {
    critical: { bgClass: 'bg-red-50 dark:bg-red-950/20', borderClass: 'border-l-red-500' },
    high: { bgClass: 'bg-orange-50 dark:bg-orange-950/20', borderClass: 'border-l-orange-500' },
    medium: { bgClass: 'bg-yellow-50 dark:bg-yellow-950/20', borderClass: 'border-l-yellow-500' },
    low: { bgClass: 'bg-green-50 dark:bg-green-950/20', borderClass: 'border-l-green-500' }
  };

  const config = priorityConfig[priority];
  const isOverdue = dueDate && new Date(dueDate) < new Date() && !['resolved', 'verified', 'closed'].includes(status || '');

  return (
    <div className={cn(
      "p-4 rounded-lg border-l-4",
      config?.bgClass,
      config?.borderClass,
      isOverdue && "border-t-4 border-t-red-500",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <PriorityIndicator 
          priority={priority} 
          dueDate={dueDate} 
          status={status}
          showSLA={true}
        />
      </div>
    </div>
  );
}
