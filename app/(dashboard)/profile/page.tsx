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
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { EmailVerificationBanner } from '@/components/auth/email-verification-banner';
import { ActiveSessions } from '@/components/auth/active-sessions';
import { AccountSecurityDashboard } from '@/components/auth/account-security-dashboard';
import { SocialAccountLinking } from '@/components/auth/social-account-linking';
import { AccountDangerZone } from '@/components/auth/account-danger-zone';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
  });
  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    image: '',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      marketing: false,
      emailFrequency: 'instant' as 'instant' | 'daily' | 'weekly',
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
  const { theme, setTheme } = useTheme();

  // Validation functions
  const validateName = (name: string): string => {
    if (name.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    return '';
  };

  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  // Real-time validation handler
  const handleValidation = useCallback((field: 'name' | 'email', value: string) => {
    let error = '';
    if (field === 'name') {
      error = validateName(value);
    } else if (field === 'email') {
      error = validateEmail(value);
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    return error === '';
  }, []);

  useEffect(() => {
    if (user) {
      const userTheme = (user.theme || theme) as 'light' | 'dark' | 'system';
      setFormData({
        name: user.name || '',
        email: user.email || '',
        image: user.image || '',
        theme: userTheme,
        notifications: {
          email: user.notifications?.email ?? true,
          push: user.notifications?.push ?? true,
          marketing: user.notifications?.marketing ?? false,
          emailFrequency: (user.notifications as any)?.emailFrequency || 'instant' as 'instant' | 'daily' | 'weekly',
        },
      });
      // Sync with theme provider if user has a saved theme preference
      if (user.theme && user.theme !== theme) {
        setTheme(user.theme as 'light' | 'dark' | 'system');
      }
    }
  }, [user, theme, setTheme]);

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
    // Validate fields if they're being updated
    Object.entries(updates).forEach(([key, value]) => {
      if ((key === 'name' || key === 'email') && typeof value === 'string') {
        handleValidation(key, value);
      }
    });
    
    setFormData(prev => ({ ...prev, ...updates }));
    if (isEditing) {
      debouncedAutoSave();
    }
  }, [isEditing, debouncedAutoSave, handleValidation]);

  // Handle theme changes with immediate application
  const handleThemeChange = useCallback((newTheme: string) => {
    const themeValue = newTheme as 'light' | 'dark' | 'system';
    
    // Immediately apply theme
    setTheme(themeValue);
    
    // Update form data and trigger auto-save
    handleFormChange({ theme: themeValue });
  }, [setTheme, handleFormChange]);

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setActiveSection(sectionId);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            scrollToSection('profile');
            break;
          case '2':
            e.preventDefault();
            scrollToSection('theme');
            break;
          case '3':
            e.preventDefault();
            scrollToSection('notifications');
            break;
          case '4':
            e.preventDefault();
            scrollToSection('security');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [scrollToSection]);

  // Intersection Observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { 
        rootMargin: '-20% 0px -80% 0px'
      }
    );

    const sections = ['profile', 'theme', 'notifications', 'security'];
    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size validation (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 2MB');
      return;
    }

    // Format validation (jpg, png, webp)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Clear any previous errors
    setError(null);

    try {
      // Create image preview before upload
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        // Create an image element to check dimensions and optimize
        const img = new Image();
        img.onload = () => {
          // Optional: You could add dimension validation here
          // if (img.width < 100 || img.height < 100) {
          //   setError('Image must be at least 100x100 pixels');
          //   return;
          // }

          // Update form data with the new image
          handleFormChange({ image: imageUrl });
        };
        img.src = imageUrl;
      };
      
      reader.onerror = () => {
        setError('Failed to read image file');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image file');
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
        
        {/* Email Verification Banner */}
        <div className="mt-4">
          <EmailVerificationBanner 
            user={{
              email: user.email,
              emailVerified: user.emailVerified
            }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <nav className="space-y-2 sticky top-4">
            <div className="mb-4 text-xs text-muted-foreground font-medium">
              Quick Navigation (Ctrl + 1-4)
            </div>
            <button
              onClick={() => scrollToSection('profile')}
              className={cn(
                "flex items-center gap-2 p-3 text-sm font-medium rounded-lg w-full text-left transition-colors",
                activeSection === 'profile' 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <User className="h-4 w-4" />
              Profile
              <span className="ml-auto text-xs opacity-60">Ctrl+1</span>
            </button>
            <button
              onClick={() => scrollToSection('theme')}
              className={cn(
                "flex items-center gap-2 p-3 text-sm font-medium rounded-lg w-full text-left transition-colors",
                activeSection === 'theme' 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Palette className="h-4 w-4" />
              Theme
              <span className="ml-auto text-xs opacity-60">Ctrl+2</span>
            </button>
            <button
              onClick={() => scrollToSection('notifications')}
              className={cn(
                "flex items-center gap-2 p-3 text-sm font-medium rounded-lg w-full text-left transition-colors",
                activeSection === 'notifications' 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Bell className="h-4 w-4" />
              Notifications
              <span className="ml-auto text-xs opacity-60">Ctrl+3</span>
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className={cn(
                "flex items-center gap-2 p-3 text-sm font-medium rounded-lg w-full text-left transition-colors",
                activeSection === 'security' 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Shield className="h-4 w-4" />
              Security
              <span className="ml-auto text-xs opacity-60">Ctrl+4</span>
            </button>
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
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center space-y-2">
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
                      <label className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                        <Camera className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {isEditing && (
                    <div className="text-xs text-muted-foreground text-center">
                      <p>Click to upload</p>
                      <p>Max 2MB</p>
                      <p>JPG, PNG, WebP</p>
                    </div>
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
                      className={cn(
                        validationErrors.name && isEditing ? "border-red-500 focus:border-red-500" : "",
                        !validationErrors.name && formData.name && isEditing ? "border-green-500" : ""
                      )}
                    />
                    {validationErrors.name && isEditing && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange({ email: e.target.value })}
                      disabled={!isEditing}
                      className={cn(
                        validationErrors.email && isEditing ? "border-red-500 focus:border-red-500" : "",
                        !validationErrors.email && formData.email && isEditing ? "border-green-500" : ""
                      )}
                    />
                    {validationErrors.email && isEditing && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                    )}
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
                onValueChange={handleThemeChange}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex-1 cursor-pointer">
                    <div className="space-y-2">
                      <div className="font-medium">Light</div>
                      <div className="text-sm text-muted-foreground">Clean and bright</div>
                      {/* Light theme preview */}
                      <div className="mt-2 h-12 w-full rounded border bg-white">
                        <div className="flex h-full">
                          <div className="flex-1 bg-gray-50 rounded-l"></div>
                          <div className="flex-1 bg-white border-l border-gray-200"></div>
                          <div className="w-8 bg-blue-500 rounded-r"></div>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex-1 cursor-pointer">
                    <div className="space-y-2">
                      <div className="font-medium">Dark</div>
                      <div className="text-sm text-muted-foreground">Easy on the eyes</div>
                      {/* Dark theme preview */}
                      <div className="mt-2 h-12 w-full rounded border bg-gray-900">
                        <div className="flex h-full">
                          <div className="flex-1 bg-gray-800 rounded-l"></div>
                          <div className="flex-1 bg-gray-900 border-l border-gray-700"></div>
                          <div className="w-8 bg-blue-400 rounded-r"></div>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex-1 cursor-pointer">
                    <div className="space-y-2">
                      <div className="font-medium">System</div>
                      <div className="text-sm text-muted-foreground">Match your device</div>
                      {/* System theme preview - split preview */}
                      <div className="mt-2 h-12 w-full rounded border overflow-hidden">
                        <div className="flex h-full">
                          <div className="flex-1 bg-white">
                            <div className="flex h-full">
                              <div className="flex-1 bg-gray-50"></div>
                              <div className="w-4 bg-blue-500"></div>
                            </div>
                          </div>
                          <div className="flex-1 bg-gray-900">
                            <div className="flex h-full">
                              <div className="flex-1 bg-gray-800"></div>
                              <div className="w-4 bg-blue-400"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive important updates and alerts via email
                    </div>
                  </div>
                  <Switch
                    checked={formData.notifications.email}
                    onChange={(e) => handleFormChange({
                      notifications: { ...formData.notifications, email: e.target.checked }
                    })}
                  />
                </div>
                
                {formData.notifications.email && (
                  <div className="ml-4 p-4 bg-muted/30 rounded-lg">
                    <Label htmlFor="emailFrequency" className="text-sm font-medium">
                      Email Frequency
                    </Label>
                    <Select
                      value={formData.notifications.emailFrequency}
                      onChange={(e) => handleFormChange({
                        notifications: { 
                          ...formData.notifications, 
                          emailFrequency: e.target.value as 'instant' | 'daily' | 'weekly'
                        }
                      })}
                      className="mt-2"
                    >
                      <option value="instant">Instant notifications</option>
                      <option value="daily">Daily digest</option>
                      <option value="weekly">Weekly summary</option>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Get real-time notifications in your browser
                    </div>
                  </div>
                  <Switch
                    checked={formData.notifications.push}
                    onChange={(e) => handleFormChange({
                      notifications: { ...formData.notifications, push: e.target.checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <div className="font-medium">Marketing Emails</div>
                    <div className="text-sm text-muted-foreground">
                      Receive updates about new features, tips, and special offers
                    </div>
                  </div>
                  <Switch
                    checked={formData.notifications.marketing}
                    onChange={(e) => handleFormChange({
                      notifications: { ...formData.notifications, marketing: e.target.checked }
                    })}
                  />
                </div>
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
              <div className="flex justify-end mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const showAll = !showPassword.current || !showPassword.new || !showPassword.confirm;
                    setShowPassword({
                      current: showAll,
                      new: showAll,
                      confirm: showAll,
                    });
                  }}
                >
                  {showPassword.current && showPassword.new && showPassword.confirm ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide All
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show All
                    </>
                  )}
                </Button>
              </div>
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
                  <PasswordStrengthIndicator password={passwordData.newPassword} />
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
          
          {/* Active Sessions */}
          <ActiveSessions />
          
          {/* Account Security Dashboard */}
          <AccountSecurityDashboard />
          
          {/* Social Account Linking */}
          <SocialAccountLinking />

          {/* Danger Zone */}
          <AccountDangerZone userEmail={user.email} />
        </div>
      </div>
    </div>
  );
}
