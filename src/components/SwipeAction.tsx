import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SwipeAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  action: () => void;
}

interface SwipeActionProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
  disabled?: boolean;
}

export default function SwipeAction({ 
  children, 
  leftActions = [], 
  rightActions = [], 
  className,
  disabled = false 
}: SwipeActionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const actionThreshold = 80; // Minimum distance to trigger action
  const maxDrag = 120; // Maximum drag distance

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || disabled) return;
      
      const currentX = e.clientX;
      const diff = currentX - startX;
      const clampedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff));
      setDragDistance(clampedDiff);
    };

    const handleMouseUp = () => {
      if (!isDragging || disabled) return;
      
      const absDistance = Math.abs(dragDistance);
      
      if (absDistance >= actionThreshold) {
        // Trigger action
        if (dragDistance > 0 && leftActions.length > 0) {
          leftActions[0].action();
        } else if (dragDistance < 0 && rightActions.length > 0) {
          rightActions[0].action();
        }
      }
      
      // Reset
      setIsDragging(false);
      setDragDistance(0);
      setStartX(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || disabled) return;
      
      const currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      const clampedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff));
      setDragDistance(clampedDiff);
    };

    const handleTouchEnd = () => {
      if (!isDragging || disabled) return;
      
      const absDistance = Math.abs(dragDistance);
      
      if (absDistance >= actionThreshold) {
        // Trigger action
        if (dragDistance > 0 && leftActions.length > 0) {
          leftActions[0].action();
        } else if (dragDistance < 0 && rightActions.length > 0) {
          rightActions[0].action();
        }
      }
      
      // Reset
      setIsDragging(false);
      setDragDistance(0);
      setStartX(0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragDistance, startX, leftActions, rightActions, disabled]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const getActionOpacity = (distance: number) => {
    const absDistance = Math.abs(distance);
    return Math.min(absDistance / actionThreshold, 1);
  };

  const getBackgroundColor = () => {
    if (Math.abs(dragDistance) < actionThreshold) return 'transparent';
    
    if (dragDistance > 0 && leftActions.length > 0) {
      return leftActions[0].color;
    } else if (dragDistance < 0 && rightActions.length > 0) {
      return rightActions[0].color;
    }
    
    return 'transparent';
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden touch-pan-y", className)}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <div 
          className="absolute left-0 top-0 h-full flex items-center justify-center"
          style={{
            width: `${Math.max(0, dragDistance)}px`,
            backgroundColor: dragDistance > actionThreshold ? leftActions[0].color : 'transparent',
            opacity: getActionOpacity(dragDistance)
          }}
        >
          {dragDistance > actionThreshold / 2 && (
            <div className="flex items-center gap-2 text-white px-4">
              {React.createElement(leftActions[0].icon, { className: "w-5 h-5" })}
              <span className="text-sm font-medium">{leftActions[0].label}</span>
            </div>
          )}
        </div>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <div 
          className="absolute right-0 top-0 h-full flex items-center justify-center"
          style={{
            width: `${Math.max(0, -dragDistance)}px`,
            backgroundColor: dragDistance < -actionThreshold ? rightActions[0].color : 'transparent',
            opacity: getActionOpacity(dragDistance)
          }}
        >
          {dragDistance < -actionThreshold / 2 && (
            <div className="flex items-center gap-2 text-white px-4">
              {React.createElement(rightActions[0].icon, { className: "w-5 h-5" })}
              <span className="text-sm font-medium">{rightActions[0].label}</span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className={cn(
          "relative transition-transform duration-200 ease-out",
          isDragging ? "transition-none" : "transition-transform"
        )}
        style={{
          transform: `translateX(${dragDistance}px)`,
          backgroundColor: getBackgroundColor()
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {children}
      </div>
    </div>
  );
}

// Common action presets
export const quickActions = {
  accept: {
    icon: CheckCircle,
    label: 'Accept',
    color: '#16a34a'
  },
  resolve: {
    icon: CheckCircle,
    label: 'Resolve',
    color: '#16a34a'
  },
  inProgress: {
    icon: Clock,
    label: 'Start',
    color: '#2563eb'
  },
  urgent: {
    icon: AlertTriangle,
    label: 'Urgent',
    color: '#dc2626'
  },
  close: {
    icon: X,
    label: 'Close',
    color: '#6b7280'
  }
};
