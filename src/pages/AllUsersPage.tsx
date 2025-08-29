import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import {
  Users,
  Shield,
  Activity,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  Building,
  UserCheck,
  UserX,
  Edit,
  MoreVertical,
  Crown,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { dbHelpers as db } from "../lib/dbhelper"
import { UserProfile } from '../models/User';
import { cn } from '../lib/utils';

export default function AllUsersPage() {

  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [ users, setUsers ] = useState<UserProfile[]>( [] );
  const [ loading, setLoading ] = useState( true );
  const [ searchTerm, setSearchTerm ] = useState( '' );
  const [ filterRole, setFilterRole ] = useState<string>( 'all' );
  const [ filterDepartment, setFilterDepartment ] = useState<string>( 'all' );
  const [ filterStatus, setFilterStatus ] = useState<string>( 'all' );
  const [ sortBy, setSortBy ] = useState<string>( 'name' );
  const [ expandedUsers, setExpandedUsers ] = useState<Set<string>>( new Set() );

  const isAdmin = profile?.role === 'admin';

  const loadUsersData = useCallback( async () => {

    try {

      let allUsers = await db.getUsers();

      setUsers( allUsers || [] );

    } catch ( error ) {

      console.error( 'Error loading users data:', error );

    } finally {

      setLoading( false );

    }

  }, [] );

  useEffect( () => {

    loadUsersData();

  }, [ loadUsersData ] );

  // Check permissions
  if ( !profile || ![ 'admin' ].includes( profile.role ) ) {

    return (

      <div className="max-w-4xl mx-auto p-4 md:p-6 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only administrators can view user management.</p>
        <Button onClick={() => navigate( '/' )} className="mt-4">
          Return to Dashboard
        </Button>
      </div>
    );

  }

  // Get unique departments
  const departments = [ ...new Set( users.map( u => u.department ).filter( Boolean ) ) ].sort();

  // Filter and sort users
  const filteredUsers = users.filter( u => {

    const matchesSearch = u.fullName?.toLowerCase().includes( searchTerm.toLowerCase() ) ||
      u.email.toLowerCase().includes( searchTerm.toLowerCase() ) ||
      u.department?.toLowerCase().includes( searchTerm.toLowerCase() );

    const matchesRole = filterRole === 'all' || u.role === filterRole;

    const matchesDepartment = filterDepartment === 'all' || u.department === filterDepartment;

    const matchesStatus = filterStatus === 'all' ||
      ( filterStatus === 'active' && u.isActive ) ||
      ( filterStatus === 'inactive' && !u.isActive );

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;

  } );

  const sortedUsers = [ ...filteredUsers ].sort( ( a, b ) => {

    switch ( sortBy ) {

      case 'name':
        return ( a.fullName || a.email ).localeCompare( b.fullName || b.email );

      case 'role':
        return a.role.localeCompare( b.role );

      case 'department':
        return ( a.department || '' ).localeCompare( b.department || '' );

      case 'created':
        return new Date( b.createdAt ).getTime() - new Date( a.createdAt ).getTime();

      default:
        return 0;
    }
  } );

  const getRoleBadgeColor = ( role: string ) => {

    switch ( role ) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'supervisor': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'field_engineer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }

  };

  const getRoleIcon = ( role: string ) => {

    switch ( role ) {
      case 'admin': return Crown;
      case 'supervisor': return Shield;
      case 'field_engineer': return Users;
      default: return UserCheck;

    }

  };

  const toggleExpanded = ( userId: string ) => {

    setExpandedUsers( prev => {

      const newSet = new Set( prev );

      if ( newSet.has( userId ) ) newSet.delete( userId );
      else newSet.add( userId );

      return newSet;

    } );

  };

  const isExpanded = ( userId: string ) => expandedUsers.has( userId );

  const userStats = {
  
    total: users.length,
    active: users.filter( u => u.isActive ).length,
    admins: users.filter( u => u.role === 'admin' ).length,
    supervisors: users.filter( u => u.role === 'supervisor' ).length,
    engineers: users.filter( u => u.role === 'field_engineer' ).length,
  
  };

  if ( loading ) {
  
    return (
  
  <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[ ...Array( 6 ) ].map( ( _, i ) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ) )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage all users, roles, and permissions across the system
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users, emails, departments..."
                  value={searchTerm}
                  onChange={( e ) => setSearchTerm( e.target.value )}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full lg:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="field_engineer">Engineer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full lg:w-48">
                <Building className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map( dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ) )}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-32">
                <Activity className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="role">Sort by Role</SelectItem>
                <SelectItem value="department">Sort by Department</SelectItem>
                <SelectItem value="created">Sort by Created Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{userStats.total}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{userStats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{userStats.admins}</div>
            <div className="text-sm text-muted-foreground">Admins</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{userStats.supervisors}</div>
            <div className="text-sm text-muted-foreground">Supervisors</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{userStats.engineers}</div>
            <div className="text-sm text-muted-foreground">Engineers</div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Users ({filteredUsers.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on any user to expand details, or use the menu for actions
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {sortedUsers.map( ( user ) => {
              const RoleIcon = getRoleIcon( user.role );

              return (
                <div key={user.id} className="border-b last:border-0">
                  {/* One-liner Summary */}
                  <div
                    className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleExpanded( user.id )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.fullName
                            ? user.fullName.substring( 0, 2 ).toUpperCase()
                            : user.email.substring( 0, 2 ).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {user.fullName || user.email}
                          </span>
                          <RoleIcon className="w-4 h-4 text-muted-foreground" />
                          <Badge className={cn( "text-xs", getRoleBadgeColor( user.role ) )}>
                            {user.role.replace( '_', ' ' )}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {user.email} • {user.department || 'No department'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center hidden sm:block">
                        <div className="text-xs text-muted-foreground">Joined</div>
                        <div className="font-medium">{new Date( user.createdAt ).toLocaleDateString()}</div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={( e ) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate( `/profile/${user.id}` )}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {/* TODO: Edit user */ }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {/* TODO: Toggle status */ }}
                            className={user.isActive ? "text-red-600" : "text-green-600"}
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded( user.id ) ? '▼' : '▶'}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded( user.id ) && (
                    <div className="p-4 bg-muted/30 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* User Information */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">User Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Full Name:</span>
                              <span>{user.fullName || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Email:</span>
                              <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Department:</span>
                              <span>{user.department || 'Not assigned'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Role:</span>
                              <Badge className={cn( "text-xs", getRoleBadgeColor( user.role ) )}>
                                {user.role.replace( '_', ' ' )}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Status:</span>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={user.isActive}
                                  onCheckedChange={() => {/* TODO: Toggle status */ }}
                                  size="sm"
                                />
                                <span className={user.isActive ? "text-green-600" : "text-red-600"}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Account Details */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Account Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Created:</span>
                              <span>{new Date( user.createdAt ).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last Updated:</span>
                              <span>{new Date( user.updatedAt ).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">User ID:</span>
                              <span className="text-xs font-mono">{user.id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Quick Actions</h4>
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate( `/profile/${user.id}` )}
                              className="w-full justify-start"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Full Profile
                            </Button>
                            {user.role === 'field_engineer' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate( `/tickets?assigned_to=${user.id}` )}
                                className="w-full justify-start"
                              >
                                <Activity className="w-4 h-4 mr-2" />
                                View Assigned Tickets
                              </Button>
                            )}
                            {user.role === 'supervisor' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate( `/engineers?department=${user.department}` )}
                                className="w-full justify-start"
                              >
                                <Users className="w-4 h-4 mr-2" />
                                View Team
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            } )}
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
