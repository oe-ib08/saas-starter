'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminUserManagement from '@/components/admin/user-management';
import AdminSubscriptionManagement from '@/components/admin/subscription-management';
import { Users, CreditCard, Shield } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/check-status');
        const data = await response.json();
        
        if (!data.authenticated || !data.user) {
          router.push('/sign-in');
          return;
        }
        
        // Check if user is admin
        const isAdmin = data.user.email === 'admin@example.com' || data.user.role === 'admin';
        
        if (!isAdmin) {
          router.push('/dashboard');
          return;
        }
        
        setSession(data);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/sign-in');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const tabs = [
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      description: 'Manage users, roles, and permissions'
    },
    {
      id: 'subscriptions',
      label: 'Subscription Management',
      icon: CreditCard,
      description: 'Manage billing and subscriptions'
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage users, subscriptions, and system settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'users' && <AdminUserManagement />}
        {activeTab === 'subscriptions' && <AdminSubscriptionManagement />}
      </div>
    </div>
  );
}
