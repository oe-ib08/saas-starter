'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, RotateCcw, Search, Users, Shield } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  deletedAt: string | null;
  stats: {
    totalMessages: number;
    activeSessions: number;
  };
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        search,
        includeDeleted: includeDeleted.toString(),
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, includeDeleted]);

  const handleDeleteUser = async (userId: string, hardDelete: boolean = false) => {
    setActionLoading(userId);
    try {
      const params = new URLSearchParams({
        userId,
        hardDelete: hardDelete.toString(),
      });
      
      const response = await fetch(`/api/admin/users?${params}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'restore',
        }),
      });
      
      if (response.ok) {
        await fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to restore user');
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      alert('Failed to restore user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'update',
          role: newRole,
        }),
      });
      
      if (response.ok) {
        await fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions across your application
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Admin Panel
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>
            Find and filter users by name, email, or status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={includeDeleted ? "default" : "outline"}
              onClick={() => setIncludeDeleted(!includeDeleted)}
            >
              {includeDeleted ? "Hide Deleted" : "Show Deleted"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className={user.deletedAt ? "border-red-200 bg-red-50/50" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      {user.deletedAt && (
                        <Badge variant="destructive" className="text-xs">
                          Deleted
                        </Badge>
                      )}
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      {user.emailVerified && (
                        <Badge variant="outline" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>{user.stats.totalMessages} messages</span>
                      <span>{user.stats.activeSessions} sessions</span>
                      <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!user.deletedAt ? (
                    <>
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === user.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Choose how to delete this user:
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id, false)}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              Soft Delete
                            </AlertDialogAction>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id, true)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Permanent Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreUser(user.id)}
                      disabled={actionLoading === user.id}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {search ? 'Try adjusting your search terms.' : 'No users match your current filters.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
