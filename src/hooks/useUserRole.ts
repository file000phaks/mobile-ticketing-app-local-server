import { useAuth } from './useAuth';

// This hook is now a simple wrapper around useAuth since profile data
// is already handled there with the new database structure
export function useUserRole() {

  const auth = useAuth();
  
  const profile = auth.profile;
  const loading = auth.loading;

  const userRole = profile?.role || 'field_engineer';
  const isAdmin = profile?.role === 'admin';
  const isSupervisor = profile?.role === 'supervisor';
  const isFieldEngineer = profile?.role === 'field_engineer';

  return {
    userRole,
    profile,
    loading,
    error: null,
    refreshProfile: auth.refreshProfile,
    isAdmin,
    isSupervisor,
    isFieldEngineer
  };

}
