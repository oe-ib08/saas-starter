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
import { Select } from '@/components/ui/select';
import { 
  CreditCard, 
  Search, 
  DollarSign, 
  Users, 
  Calendar,
  XCircle,
  PlayCircle,
  Ban,
  Plus,
  TrendingUp
} from 'lucide-react';

interface SubscriptionDetails {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  amount: number;
  currency: string;
  interval: string;
  productName: string;
  trialEnd: string | null;
}

interface CustomerDetails {
  id: string;
  created: string;
  defaultPaymentMethod: string | null;
}

interface UserWithSubscription {
  id: string;
  name: string;
  email: string;
  role: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeProductId: string | null;
  subscriptionStatus: string | null;
  createdAt: string;
  subscriptionDetails: SubscriptionDetails | null;
  customerDetails: CustomerDetails | null;
}

interface Stats {
  total: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  totalRevenue: number;
}

export default function AdminSubscriptionManagement() {
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    activeSubscriptions: 0,
    canceledSubscriptions: 0,
    totalRevenue: 0
  });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        status: statusFilter,
      });
      
      const response = await fetch(`/api/admin/subscriptions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch subscriptions');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [search, statusFilter]);

  const handleSubscriptionAction = async (userId: string, action: string, subscriptionId?: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action,
          subscriptionId,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Action completed successfully');
        await fetchSubscriptions(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to perform action');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">No Subscription</Badge>;
    
    const statusColors = {
      active: 'default',
      canceled: 'destructive',
      incomplete: 'secondary',
      incomplete_expired: 'destructive',
      past_due: 'destructive',
      unpaid: 'destructive',
      trialing: 'outline',
    } as const;
    
    return (
      <Badge variant={statusColors[status as keyof typeof statusColors] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
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
            <CreditCard className="h-8 w-8" />
            Subscription Management
          </h1>
          <p className="text-muted-foreground">
            Manage user subscriptions, billing, and payment status
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceled Subscriptions</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.canceledSubscriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>
            Find and filter users by subscription status
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
            <Select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active Only</option>
              <option value="inactive">No Subscription</option>
              <option value="canceled">Canceled</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscription List */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      {getStatusBadge(user.subscriptionStatus)}
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                    
                    {user.subscriptionDetails ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Plan</p>
                          <p className="font-medium">{user.subscriptionDetails.productName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">
                            {formatCurrency(user.subscriptionDetails.amount, user.subscriptionDetails.currency)}/
                            {user.subscriptionDetails.interval}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next Billing</p>
                          <p className="font-medium">{formatDate(user.subscriptionDetails.currentPeriodEnd)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Customer Since</p>
                          <p className="font-medium">{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No active subscription
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.subscriptionDetails ? (
                    <>
                      {user.subscriptionDetails.status === 'active' && !user.subscriptionDetails.cancelAtPeriodEnd && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === user.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                              <AlertDialogDescription>
                                Choose how to cancel this user's subscription:
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleSubscriptionAction(user.id, 'cancel_subscription')}
                                className="bg-yellow-600 hover:bg-yellow-700"
                              >
                                End at Period End
                              </AlertDialogAction>
                              <AlertDialogAction
                                onClick={() => handleSubscriptionAction(user.id, 'immediate_cancel')}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Cancel Immediately
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      {user.subscriptionDetails.cancelAtPeriodEnd && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSubscriptionAction(user.id, 'reactivate_subscription')}
                          disabled={actionLoading === user.id}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Reactivate
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // In a real app, you'd open a modal to create subscription
                        alert('Create subscription feature would be implemented here');
                      }}
                      disabled={actionLoading === user.id}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create Subscription
                    </Button>
                  )}
                </div>
              </div>
              
              {user.subscriptionDetails?.cancelAtPeriodEnd && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This subscription will be canceled on {formatDate(user.subscriptionDetails.currentPeriodEnd)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No subscriptions found</h3>
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all' 
                ? 'Try adjusting your search terms or filters.' 
                : 'No users have subscriptions yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
