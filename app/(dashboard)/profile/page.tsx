"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Camera, Mail, Shield, Bell, Palette, Save, Trash2, Eye, EyeOff, Clock, Check } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { User as UserType } from '@/lib/db/schema';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ProfileData extends UserType {
  theme?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
}

export default function ProfilePage() {
  const { data: user, isLoading } = useSWR<ProfileData>('/api/user', fetcher);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    image: '',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      marketing: false,
    },
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const router = useRouter();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        image: user.image || '',
        theme: user.theme || 'light',
        notifications: user.notifications || {
          email: true,
          push: true,
          marketing: false,
        },
      });
    }
  }, [user]);

  const handleSaveProfile = async (showSuccessMessage = true) => {
    const isSavingState = showSuccessMessage ? setIsSaving : setIsAutoSaving;
    isSavingState(true);
    setError(null);
    if (showSuccessMessage) setSuccess(null);
    
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        mutate('/api/user');
        setLastSaved(new Date());
        if (showSuccessMessage) {
          setIsEditing(false);
          setSuccess('Profile updated successfully!');
          setTimeout(() => setSuccess(null), 3000);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('An unexpected error occurred');
    } finally {
      isSavingState(false);
    }
  };

  // Auto-save function with debouncing
  const debouncedAutoSave = useDebouncedCallback(() => {
    if (isEditing) {
      handleSaveProfile(false);
    }
  }, 2000);

  // Handle form changes and trigger auto-save
  const handleFormChange = useCallback((updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    if (isEditing) {
      debouncedAutoSave();
    }
  }, [isEditing, debouncedAutoSave]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a service like AWS S3 or Cloudinary
      // For now, we'll create a data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      // Use better-auth to change password
      await authClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Password updated successfully');
    } catch (error) {
      console.error('Password change failed:', error);
      alert('Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
      });

      if (response.ok) {
        await authClient.signOut();
        router.push('/sign-up');
      } else {
        console.error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
        
        {/* Success/Error Messages */}
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <nav className="space-y-2">
            <a href="#profile" className="flex items-center gap-2 p-3 text-sm font-medium rounded-lg bg-muted text-foreground">
              <User className="h-4 w-4" />
              Profile
            </a>
            <a href="#theme" className="flex items-center gap-2 p-3 text-sm font-medium rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
              <Palette className="h-4 w-4" />
              Theme
            </a>
            <a href="#notifications" className="flex items-center gap-2 p-3 text-sm font-medium rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              Notifications
            </a>
            <a href="#security" className="flex items-center gap-2 p-3 text-sm font-medium rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
              <Shield className="h-4 w-4" />
              Security
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Profile Information */}
          <Card id="profile">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
                {isEditing && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    {isAutoSaving ? (
                      <>
                        <Clock className="h-3 w-3 animate-spin" />
                        <span className="text-muted-foreground">Auto-saving...</span>
                      </>
                    ) : lastSaved ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-muted-foreground">
                          Last saved {lastSaved.toLocaleTimeString()}
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setIsEditing(false)} 
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleSaveProfile(true)} 
                    disabled={isSaving}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={formData.image} alt={formData.name} />
                    <AvatarFallback className="text-lg">
                      {formData.name
                        ? formData.name.split(' ').map((n) => n[0]).join('')
                        : formData.email.split('@')[0].substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange({ name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange({ email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Preferences */}
          <Card id="theme">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Preferences
              </CardTitle>
              <CardDescription>
                Choose your preferred theme for the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.theme}
                onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex-1 cursor-pointer">
                    <div className="font-medium">Light</div>
                    <div className="text-sm text-muted-foreground">Clean and bright</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex-1 cursor-pointer">
                    <div className="font-medium">Dark</div>
                    <div className="text-sm text-muted-foreground">Easy on the eyes</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex-1 cursor-pointer">
                    <div className="font-medium">System</div>
                    <div className="text-sm text-muted-foreground">Match your device</div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card id="notifications">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: e.target.checked }
                  }))}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.push}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: e.target.checked }
                  }))}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Marketing Emails</div>
                  <div className="text-sm text-muted-foreground">
                    Receive emails about new features and updates
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifications.marketing}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, marketing: e.target.checked }
                  }))}
                  className="h-4 w-4"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card id="security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button onClick={handlePasswordChange} className="w-full">
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete your account? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteAccount}
                    >
                      Yes, Delete My Account
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
