import React from 'react';
import { useAuth } from '../hooks/useAuth';
import FieldEngineerDashboard from '../components/dashboards/FieldEngineerDashboard';
import SupervisorDashboard from '../components/dashboards/SupervisorDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import { Loader2 } from 'lucide-react';

const Index: React.FC = () => {

  const { profile, loading } = useAuth();

  if ( loading ) {

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>

    );

  }

  if ( !profile ) {

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 text-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );

  }

  // Route to appropriate dashboard based on user role
  switch ( profile.role ) {

    case 'admin':
      return (
        <div className="h-full p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <AdminDashboard />
          </div>
        </div>
      );

    case 'supervisor':
      return (
        <div className="h-full p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <SupervisorDashboard />
          </div>
        </div>
      );

    case 'field_engineer':
    default:
      return (
        <div className="h-full p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <FieldEngineerDashboard />
          </div>
        </div>
      );
  }

};

export default Index;
