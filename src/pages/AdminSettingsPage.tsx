import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  Settings,
  Users,
  Shield,
  Database,
  Bell,
  Mail,
  Server,
  AlertTriangle,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';
import { toast } from '../components/ui/use-toast';

export default function AdminSettingsPage() {

  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const [ loading, setLoading ] = useState( false );
  const [ showPasswords, setShowPasswords ] = useState( false );

  const [ systemSettings, setSystemSettings ] = useState( {
    siteName: 'Field Engineer Portal',
    siteDescription: 'Maintenance management system',
    enableNotifications: true,
    enableEmailAlerts: true,
    autoAssignTickets: false,
    requireVerification: true,
    maxFileSize: 50, // MB
    sessionTimeout: 60, // minutes
  } );

  const [ securitySettings, setSecuritySettings ] = useState( {
    enforceStrongPasswords: true,
    requireTwoFactor: false,
    sessionSecurity: true,
    auditLogging: true,
    allowGuestAccess: false,
    maxLoginAttempts: 5,
  } );

  React.useEffect( () => {

    // Redirect non-admin users (after all hooks are called)
    if ( !isAdmin ) navigate( '/' );

    else navigate('/admin/settings')

  }, [ isAdmin ])

  if ( !isAdmin ) return null;

  const handleSaveSettings = async () => {

    setLoading( true );
    try {
      // In a real app, this would save to the backend
      await new Promise( resolve => setTimeout( resolve, 1000 ) );

      toast( {
        title: 'Settings saved',
        description: 'System settings have been updated successfully.',
      } );
    } catch ( error ) {
      toast( {
        title: 'Error saving settings',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      } );
    } finally {
      setLoading( false );
    }
  };

  const testCredentials = [
    { email: 'admin@test.com', password: 'admin123', role: 'admin' },
    { email: 'supervisor@test.com', password: 'supervisor123', role: 'supervisor' },
    { email: 'engineer@test.com', password: 'engineer123', role: 'field_engineer' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate( '/' )}
          className="hover:bg-accent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground">
            Manage system configuration and security settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="demo">Demo Info</TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={systemSettings.siteName}
                    onChange={( e ) => setSystemSettings( prev => ( { ...prev, siteName: e.target.value } ) )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={systemSettings.siteDescription}
                    onChange={( e ) => setSystemSettings( prev => ( { ...prev, siteDescription: e.target.value } ) )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={systemSettings.maxFileSize}
                    onChange={( e ) => setSystemSettings( prev => ( { ...prev, maxFileSize: parseInt( e.target.value ) } ) )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={( e ) => setSystemSettings( prev => ( { ...prev, sessionTimeout: parseInt( e.target.value ) } ) )}
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Feature Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Notifications</Label>
                      <p className="text-sm text-muted-foreground">Allow system notifications to users</p>
                    </div>
                    <Switch
                      checked={systemSettings.enableNotifications}
                      onCheckedChange={( checked ) => setSystemSettings( prev => ( { ...prev, enableNotifications: checked } ) )}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Email Alerts</Label>
                      <p className="text-sm text-muted-foreground">Send email notifications for important events</p>
                    </div>
                    <Switch
                      checked={systemSettings.enableEmailAlerts}
                      onCheckedChange={( checked ) => setSystemSettings( prev => ( { ...prev, enableEmailAlerts: checked } ) )}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-assign Tickets</Label>
                      <p className="text-sm text-muted-foreground">Automatically assign tickets to available engineers</p>
                    </div>
                    <Switch
                      checked={systemSettings.autoAssignTickets}
                      onCheckedChange={( checked ) => setSystemSettings( prev => ( { ...prev, autoAssignTickets: checked } ) )}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Verification</Label>
                      <p className="text-sm text-muted-foreground">Require supervisor verification for completed tickets</p>
                    </div>
                    <Switch
                      checked={systemSettings.requireVerification}
                      onCheckedChange={( checked ) => setSystemSettings( prev => ( { ...prev, requireVerification: checked } ) )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enforce Strong Passwords</Label>
                    <p className="text-sm text-muted-foreground">Require complex passwords for all users</p>
                  </div>
                  <Switch
                    checked={securitySettings.enforceStrongPasswords}
                    onCheckedChange={( checked ) => setSecuritySettings( prev => ( { ...prev, enforceStrongPasswords: checked } ) )}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Enable 2FA for enhanced security</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireTwoFactor}
                    onCheckedChange={( checked ) => setSecuritySettings( prev => ( { ...prev, requireTwoFactor: checked } ) )}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Security</Label>
                    <p className="text-sm text-muted-foreground">Enhanced session management and timeout</p>
                  </div>
                  <Switch
                    checked={securitySettings.sessionSecurity}
                    onCheckedChange={( checked ) => setSecuritySettings( prev => ( { ...prev, sessionSecurity: checked } ) )}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all user actions for security audits</p>
                  </div>
                  <Switch
                    checked={securitySettings.auditLogging}
                    onCheckedChange={( checked ) => setSecuritySettings( prev => ( { ...prev, auditLogging: checked } ) )}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Guest Access</Label>
                    <p className="text-sm text-muted-foreground">Allow limited access for guest users</p>
                  </div>
                  <Switch
                    checked={securitySettings.allowGuestAccess}
                    onCheckedChange={( checked ) => setSecuritySettings( prev => ( { ...prev, allowGuestAccess: checked } ) )}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={( e ) => setSecuritySettings( prev => ( { ...prev, maxLoginAttempts: parseInt( e.target.value ) } ) )}
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground">
                    Lock account after this many failed login attempts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                User management features would be implemented here in a production system.
              </p>
              <div className="space-y-4">
                <Button variant="outline" className="w-full" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Roles & Permissions
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  <Mail className="w-4 h-4 mr-2" />
                  Send User Invitations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demo Information */}
        <TabsContent value="demo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Demo Mode Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Demo Mode Active</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  This application is running in demo mode with mock data. In production, it would connect to a real Supabase database.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  Test Credentials
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswords( !showPasswords )}
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </h3>
                <div className="space-y-2">
                  {testCredentials.map( ( cred, index ) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{cred.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Password: {showPasswords ? cred.password : '••••••••'}
                        </div>
                      </div>
                      <Badge variant={cred.role === 'admin' ? 'default' : 'secondary'}>
                        {cred.role}
                      </Badge>
                    </div>
                  ) )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Features Available in Demo</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• User authentication with test accounts</li>
                  <li>• Role-based dashboards (Admin, Supervisor, Field Engineer)</li>
                  <li>• Ticket creation and management</li>
                  <li>• Mock data for tickets, users, and activities</li>
                  <li>• All UI components and navigation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate( '/' )}>
          Cancel
        </Button>
        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
