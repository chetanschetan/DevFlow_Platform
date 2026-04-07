import { useState } from 'react';
import * as React from 'react'; // Add this at the very top
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  User,
  Mail,
  Shield,
  Lock,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ProfileData {
  firstName: string;
  lastName: string;
  course: string;
  section: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // FIX: Use a useEffect or set state only when user exists to prevent crashes
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    course: '',
    section: '',
  });

  // Sync state when user data arrives
  React.useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        course: user.course || '',
        section: user.section || '',
      });
    }
  }, [user]);

  // FIX: Loading Guard
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const response = await api.user.updateProfile(data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const sendPasswordResetOTPMutation = useMutation({
    mutationFn: async () => {
      const response = await api.user.sendPasswordResetOTP();
      return response.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Password reset OTP has been sent to your email",
      });
    },
    onError: (error: any) => {
      toast({
        title: "OTP Failed",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string; otp: string }) => {
      const response = await api.user.changePassword(data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully",
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setOtpCode('');
      setShowPasswordForm(false);
      setOtpSent(false);
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      otp: otpCode,
    });
  };

  const handleSendOTP = () => {
    sendPasswordResetOTPMutation.mutate();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course">Course</Label>
                  <Input
                    id="course"
                    value={profileData.course}
                    onChange={(e) => setProfileData({ ...profileData, course: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={profileData.section}
                    onChange={(e) => setProfileData({ ...profileData, section: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                className="w-full"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Username</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={user?.username} disabled />
                <Badge variant="secondary">{user?.role}</Badge>
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={user?.email} disabled />
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div>
              <Label>Registration Date</Label>
              <Input 
                value={user?.registerDate ? new Date(user.registerDate).toLocaleDateString() : ''} 
                disabled 
              />
            </div>

            <Separator />

            {/* Password Change Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium">Change Password</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </Button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  {!otpSent ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendOTP}
                      disabled={sendPasswordResetOTPMutation.isPending}
                      className="w-full"
                    >
                      {sendPasswordResetOTPMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Send OTP to Email
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP from Email</Label>
                      <Input
                        id="otp"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        required
                      />
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          OTP has been sent to {user?.email}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={changePasswordMutation.isPending || !otpSent || !otpCode}
                    className="w-full"
                  >
                    {changePasswordMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Change Password
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 