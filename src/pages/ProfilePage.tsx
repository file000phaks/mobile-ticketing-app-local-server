import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import {
  User,
  Shield,
  Settings,
  Bell,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Download,
  Upload,
  LogOut,
  Mail,
  Calendar,
  MapPin,
  UserCog,
  AlertTriangle,
  CheckCircle,
  Building,
  Phone,
  Edit,
  Save,
  X,
  Crown,
  Users
} from 'lucide-react';
import { useTheme } from '../components/theme-provider';
import { toast } from '../components/ui/use-toast';
import { dbHelpers as db } from "../lib/dbhelper";
import { authHelper as auth } from '../lib/authhelper';
import { UserProfile } from '../models/User';

interface UserStats {
  totalTickets: number;
  completedTickets: number;
  avgResolutionTime: number;
  lastActivity: string;
}

export default function ProfilePage() {

  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile, signOut, updateProfile } = useAuth();
  const isOnline = useOnlineStatus();
  const { theme, setTheme } = useTheme();

  const [ profile, setProfile ] = useState<UserProfile | null>( null );
  const [ userStats, setUserStats ] = useState<UserStats | null>( null );
  const [ isEditing, setIsEditing ] = useState( false );
  const [ editedProfile, setEditedProfile ] = useState<Partial<UserProfile>>( {} );
  const [ loading, setLoading ] = useState( false );
  const [ notifications, setNotifications ] = useState( true );
  const [ autoSync, setAutoSync ] = useState( true );
  const [ locationTracking, setLocationTracking ] = useState( false );

  const isViewingOwnProfile = !userId || userId === user?.id;
  const isAdmin = currentUserProfile?.role === 'admin';
  const canManageUser = isAdmin && !isViewingOwnProfile;

  useEffect( () => {

    loadProfile();

  }, [ userId, user ] );

  const loadProfile = async () => {

    try {

      setLoading( true );

      if ( isViewingOwnProfile ) {

        setProfile( currentUserProfile );
        setEditedProfile( currentUserProfile || {} );

      } else if ( userId && isAdmin ) {

        try {

          const userProfile = await db.getUserProfile( userId );
          setProfile( userProfile );
          setEditedProfile( userProfile || {} );

        } catch ( profileError ) {

          console.error( 'Error loading user profile:', profileError );
          throw profileError;

        }

      }

      // Load user statistics
      const targetProfile = profile || currentUserProfile;

      if ( targetProfile ) {

        const targetUserId = userId || user?.id;

        try {

          const stats = await db.getUserStats( targetUserId );
          setUserStats( stats );

        } catch ( statsError ) {

          console.warn( 'Error loading user stats (non-fatal):', statsError );

        }

      }

    } catch ( error ) {

      console.error( 'Error loading profile:', {
        message: error instanceof Error ? error.message : String( error ),
        stack: error instanceof Error ? error.stack : undefined,
        userId: userId,
        isViewingOwnProfile: isViewingOwnProfile,
        error: error
      } );

      toast( {
        title: 'Error',
        description: 'Failed to load profile information.',
        variant: 'destructive'
      } );

    } finally {

      setLoading( false );

    }

  };

  const handleSaveProfile = async () => {

    try {

      setLoading( true );

      if ( isViewingOwnProfile ) {

        // Update own profile
        await updateProfile( editedProfile );

      } else if ( canManageUser && userId ) {

        // Update another user's profile (admin only)
        await updateProfile( editedProfile );

      }

      const currentProfile = auth.getCurrentUserProfile();

      // setProfile(currentUserProfile);
      // setEditedProfile( profile || {} );

      setProfile( { ...profile, ...editedProfile } as UserProfile );

      console.log(currentProfile);

      setIsEditing( false );

      toast( {
        title: 'Profile updated',
        description: 'Profile information has been saved successfully.',
      } );

    } catch ( error ) {

      console.error( 'Error updating profile:', error );

      toast( {
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      } );

    } finally {

      setLoading( false );

    }

  };

  const handleRoleChange = async ( newRole: 'admin' | 'supervisor' | 'field_engineer' ) => {

    if ( !canManageUser || !userId ) return;

    try {
      setLoading( true );

      const { data, error } = await db.updateUserRole( userId, newRole as 'admin' | 'supervisor' | 'field_engineer' );

      if ( error ) throw error;

      setProfile( data );

      toast( {
        title: 'Role updated',
        description: `User role has been changed to ${newRole.replace( '_', ' ' )}.`,
      } );

    } catch ( error ) {

      console.error( 'Error updating role:', error );
      toast( {
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive'
      } );

    } finally {

      setLoading( false );

    }

  };

  const handleDeactivateUser = async () => {

    if ( !canManageUser || !userId ) return;

    try {

      setLoading( true );

      const { data, error } = await db.deactivateUser( userId );

      if ( error ) throw error

      setProfile( data );

      toast( {
        title: 'User deactivated',
        description: 'User account has been deactivated.',
      } );

    } catch ( error ) {

      console.error( 'Error deactivating user:', error );

      toast( {
        title: 'Error',
        description: 'Failed to deactivate user. Please try again.',
        variant: 'destructive'
      } );

    } finally {

      setLoading( false );

    }

  };

  const handleSignOut = async () => {

    try {

      await signOut();

    } catch ( error ) {

      toast( {
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      } );

    }

  };

  const handleExportData = () => {

    const data = {
      user: profile?.email,
      exportDate: new Date().toISOString(),
      profile: profile,
      stats: userStats,
    };

    const blob = new Blob( [ JSON.stringify( data, null, 2 ) ], { type: 'application/json' } );
    const url = URL.createObjectURL( blob );
    const a = document.createElement( 'a' );
    a.href = url;
    a.download = `profile-data-${new Date().toISOString().split( 'T' )[ 0 ]}.json`;
    a.click();
    URL.revokeObjectURL( url );

    toast( {
      title: 'Data exported',
      description: 'Profile data has been downloaded successfully.',
    } );

  };

  const getUserInitials = ( name?: string, email?: string ) => {

    if ( name ) return name.split( ' ' ).map( n => n[ 0 ] ).join( '' ).toUpperCase().substring( 0, 2 );

    return email ? email.substring( 0, 2 ).toUpperCase() : 'U';

  };

  const getRoleBadgeVariant = ( role: string ) => {

    switch ( role ) {
      case 'admin': return 'destructive';
      case 'supervisor': return 'default';
      case 'field_engineer': return 'secondary';
      default: return 'secondary';
    }

  };

  const getRoleIcon = ( role: string ) => {

    switch ( role ) {
      case 'admin': return Crown;
      case 'supervisor': return Shield;
      case 'field_engineer': return User;
      default: return User;
    }

  };

  if ( loading && !profile ) {

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );

  }

  if ( !profile ) {

    return (

      <div className="max-w-4xl mx-auto p-4 md:p-6 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground">The requested profile could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            {isViewingOwnProfile ? 'My Profile' : `${profile.fullName || profile.email}'s Profile`}
          </h1>
          <p className="text-muted-foreground">
            {isViewingOwnProfile
              ? 'Manage your account and preferences'
              : 'User profile and role management'}
          </p>
        </div>

        {isViewingOwnProfile && (
          <Button
            variant={isEditing ? "destructive" : "outline"}
            onClick={() => {
              if ( isEditing ) {
                setEditedProfile( profile );
              }
              setIsEditing( !isEditing );
            }}
          >
            {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          {canManageUser && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="text-xl">
                      {getUserInitials( profile.fullName, profile.email )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {profile.fullName || profile.email}
                      </h3>
                      {!profile.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getRoleBadgeVariant( profile.role )} className="text-xs">
                        {React.createElement( getRoleIcon( profile.role ), { className: "w-3 h-3 mr-1" } )}
                        {profile.role.replace( '_', ' ' ).toUpperCase()}
                      </Badge>
                      <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                        {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                        {isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="fullName"
                        value={editedProfile.fullName || ''}
                        onChange={( e ) => setEditedProfile( { ...editedProfile, fullName: e.target.value } )}
                        placeholder="Enter full name"
                      />
                    ) : (
                      <Input value={profile.fullName || ''} disabled className="bg-muted" />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input value={profile.email} disabled className="bg-muted" />
                  </div>

                  <div>
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <Input
                        id="department"
                        value={editedProfile.department || ''}
                        onChange={( e ) => setEditedProfile( { ...editedProfile, department: e.target.value } )}
                        placeholder="Enter department"
                      />
                    ) : (
                      <Input value={profile.department || 'Not specified'} disabled className="bg-muted" />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editedProfile.phone || ''}
                        onChange={( e ) => setEditedProfile( { ...editedProfile, phone: e.target.value } )}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <Input value={profile.phone || 'Not provided'} disabled className="bg-muted" />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="joined">Member Since</Label>
                    <Input
                      value={new Date( profile.createdAt ).toLocaleDateString()}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {isEditing && (
                    <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Quick Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userStats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{userStats.totalTickets}</div>
                      <div className="text-sm text-muted-foreground">Total Tickets</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{userStats.completedTickets}</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{userStats.avgResolutionTime.toFixed( 1 )}h</div>
                      <div className="text-sm text-muted-foreground">Avg Resolution</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {userStats.totalTickets > 0 ? Math.round( ( userStats.completedTickets / userStats.totalTickets ) * 100 ) : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Loading statistics...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Performance Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Detailed Statistics</h3>
                <p className="text-sm">Performance charts and detailed analytics coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* App Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  App Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={( checked ) => setTheme( checked ? 'dark' : 'light' )}
                    />
                    <Moon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive updates about ticket assignments
                    </p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Auto Sync</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically sync when online
                    </p>
                  </div>
                  <Switch
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Location Tracking</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow location access for field work
                    </p>
                  </div>
                  <Switch
                    checked={locationTracking}
                    onCheckedChange={setLocationTracking}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Profile Data
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast( {
                        title: 'Sync started',
                        description: 'Syncing your data...',
                      } );
                    }}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Sync Now
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast( {
                        title: 'Cache cleared',
                        description: 'Local cache has been cleared.',
                      } );
                    }}
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Clear Cache
                  </Button>
                </div>

                {isViewingOwnProfile && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={handleSignOut}
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Admin Tab */}
        {canManageUser && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role">User Role</Label>
                    <Select value={profile.role} onValueChange={handleRoleChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="field_engineer">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Field Engineer
                          </div>
                        </SelectItem>
                        <SelectItem value="supervisor">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Supervisor
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4" />
                            Administrator
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Change the user's role and permissions
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Account Status</Label>
                      <p className="text-xs text-muted-foreground">
                        {profile.isActive ? 'Account is active and can access the system' : 'Account is deactivated'}
                      </p>
                    </div>
                    <Badge variant={profile.isActive ? "default" : "destructive"}>
                      {profile.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {profile.isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Deactivate User Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate User Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to deactivate this user account?
                            The user will lose access to the system and all assigned tickets will need to be reassigned.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeactivateUser} className="bg-destructive text-destructive-foreground">
                            Deactivate Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
