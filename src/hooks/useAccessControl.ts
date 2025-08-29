import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export interface AccessControlRule {
  roles: string[];
  redirect?: string;
  message?: string;
}

export interface PermissionCheck {
  hasAccess: boolean;
  userRole: string | null;
  isAdmin: boolean;
  isSupervisor: boolean;
  isFieldEngineer: boolean;
  canViewAllTickets: boolean;
  canManageUsers: boolean;
  canAssignTickets: boolean;
  canVerifyTickets: boolean;
  canViewReports: boolean;
  canManageEquipment: boolean;
}

export const useAccessControl = (rules?: AccessControlRule): PermissionCheck => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const userRole = profile?.role || null;
  const isAdmin = userRole === 'admin';
  const isSupervisor = userRole === 'supervisor';
  const isFieldEngineer = userRole === 'field_engineer';

  // Define permissions based on role
  const permissions: PermissionCheck = {
    hasAccess: true,
    userRole,
    isAdmin,
    isSupervisor,
    isFieldEngineer,
    canViewAllTickets: isAdmin || isSupervisor,
    canManageUsers: isAdmin,
    canAssignTickets: isAdmin || isSupervisor,
    canVerifyTickets: isAdmin || isSupervisor,
    canViewReports: isAdmin || isSupervisor,
    canManageEquipment: isAdmin || isSupervisor,
  };

  // Check access rules if provided
  if (rules && userRole) {
    permissions.hasAccess = rules.roles.includes(userRole);
  }

  // Redirect if access denied
  useEffect(() => {
    if (rules && !permissions.hasAccess && userRole) {
      const redirectPath = rules.redirect || '/';
      navigate(redirectPath);
      
      if (rules.message) {
        console.warn('Access denied:', rules.message);
      }
    }
  }, [permissions.hasAccess, userRole, rules, navigate]);

  return permissions;
};

// Route-specific hooks for common access patterns
export const useAdminOnly = () => {
  return useAccessControl({
    roles: ['admin'],
    redirect: '/',
    message: 'This page is only accessible to administrators.'
  });
};

export const useAdminOrSupervisor = () => {
  return useAccessControl({
    roles: ['admin', 'supervisor'],
    redirect: '/',
    message: 'This page is only accessible to administrators and supervisors.'
  });
};

export const useAuthenticatedOnly = () => {
  return useAccessControl({
    roles: ['admin', 'supervisor', 'field_engineer'],
    redirect: '/login',
    message: 'You must be logged in to access this page.'
  });
};

// Utility functions for permission checks
export const canUserAccess = (userRole: string | null, requiredRoles: string[]): boolean => {
  return userRole ? requiredRoles.includes(userRole) : false;
};

export const canViewTicket = (userRole: string | null, userId: string | null, ticket: any): boolean => {
  if (!userRole || !userId) return false;
  
  // Admins and supervisors can view all tickets
  if (userRole === 'admin' || userRole === 'supervisor') {
    return true;
  }
  
  // Field engineers can only view their own tickets (created or assigned)
  return ticket.created_by === userId || ticket.assigned_to === userId;
};

export const canEditTicket = (userRole: string | null, userId: string | null, ticket: any): boolean => {
  if (!userRole || !userId) return false;
  
  // Admins can edit all tickets
  if (userRole === 'admin') {
    return true;
  }
  
  // Supervisors can edit all tickets except closed ones
  if (userRole === 'supervisor') {
    return ticket.status !== 'closed';
  }
  
  // Field engineers can only edit tickets assigned to them and not closed
  if (userRole === 'field_engineer') {
    return ticket.assigned_to === userId && ticket.status !== 'closed';
  }
  
  return false;
};

export const canAssignTicket = (userRole: string | null): boolean => {
  return userRole === 'admin' || userRole === 'supervisor';
};

export const canDeleteTicket = (userRole: string | null, userId: string | null, ticket: any): boolean => {
  if (!userRole || !userId) return false;
  
  // Only admins can delete tickets
  if (userRole === 'admin') {
    return true;
  }
  
  // Supervisors can delete tickets they created if they're still open
  if (userRole === 'supervisor') {
    return ticket.created_by === userId && ticket.status === 'open';
  }
  
  // Field engineers can delete tickets they created if they're still open and unassigned
  if (userRole === 'field_engineer') {
    return ticket.created_by === userId && ticket.status === 'open' && !ticket.assigned_to;
  }
  
  return false;
};

export const canManageProfile = (userRole: string | null, userId: string | null, profileUserId: string): boolean => {
  if (!userRole || !userId) return false;
  
  // Users can always edit their own profile
  if (userId === profileUserId) {
    return true;
  }
  
  // Admins can edit any profile
  return userRole === 'admin';
};

export const canPromoteUser = (userRole: string | null, targetRole: string): boolean => {
  if (userRole !== 'admin') return false;
  
  // Admins can promote to any role
  return ['field_engineer', 'supervisor', 'admin'].includes(targetRole);
};

// Role hierarchy for validation
export const ROLE_HIERARCHY = {
  'field_engineer': 1,
  'supervisor': 2,
  'admin': 3
};

export const isHigherRole = (userRole: string, targetRole: string): boolean => {
  return (ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0) > 
         (ROLE_HIERARCHY[targetRole as keyof typeof ROLE_HIERARCHY] || 0);
};

export default useAccessControl;
