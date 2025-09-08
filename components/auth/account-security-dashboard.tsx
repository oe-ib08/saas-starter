"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, MapPin, Clock, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'login' | 'password_change' | 'email_change' | 'session_revoked';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  location?: string;
}

interface SecurityDashboardData {
  lastLogin?: {
    timestamp: string;
    ipAddress?: string;
    location?: string;
  };
  recentEvents: SecurityEvent[];
  securityScore: number;
}

export function AccountSecurityDashboard() {
  const [securityData, setSecurityData] = useState<SecurityDashboardData>({
    recentEvents: [],
    securityScore: 85
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const response = await fetch('/api/auth/security-dashboard');
      if (response.ok) {
        const data = await response.json();
        setSecurityData(data);
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string, success: boolean) => {
    if (!success) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    
    switch (type) {
      case 'login':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'password_change':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'email_change':
        return <CheckCircle className="h-4 w-4 text-orange-500" />;
      case 'session_revoked':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventDescription = (event: SecurityEvent) => {
    const base = event.success ? '' : 'Failed ';
    switch (event.type) {
      case 'login':
        return `${base}Sign in${event.location ? ` from ${event.location}` : ''}`;
      case 'password_change':
        return `${base}Password changed`;
      case 'email_change':
        return `${base}Email address changed`;
      case 'session_revoked':
        return 'Session revoked';
      default:
        return 'Security event';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>Your account security status and recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Overview
        </CardTitle>
        <CardDescription>
          Your account security status and recent activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Score */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <h3 className="font-medium">Security Score</h3>
            <p className="text-sm text-muted-foreground">
              Based on your security settings and activity
            </p>
          </div>
          <div className={`text-2xl font-bold ${getSecurityScoreColor(securityData.securityScore)}`}>
            {securityData.securityScore}/100
          </div>
        </div>

        {/* Last Login */}
        {securityData.lastLogin && (
          <div className="flex items-start gap-3 p-4 border rounded-lg">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium">Last Login</h3>
              <p className="text-sm text-muted-foreground">
                {formatTimestamp(securityData.lastLogin.timestamp)}
              </p>
              {securityData.lastLogin.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  {securityData.lastLogin.location}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Security Events */}
        <div>
          <h3 className="font-medium mb-3">Recent Security Events</h3>
          {securityData.recentEvents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No recent security events
            </div>
          ) : (
            <div className="space-y-3">
              {securityData.recentEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getEventIcon(event.type, event.success)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {getEventDescription(event)}
                      </span>
                      {!event.success && (
                        <Badge variant="destructive" className="text-xs">
                          Failed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(event.timestamp)}
                      {event.ipAddress && ` • ${event.ipAddress}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Recommendations */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Security Recommendations
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Enable two-factor authentication for enhanced security</li>
            <li>• Review and revoke any unfamiliar active sessions</li>
            <li>• Use a strong, unique password for your account</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}