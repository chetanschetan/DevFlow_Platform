import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, LogIn, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(formData.username, formData.password);
      
      // Check if the logged-in user is an admin
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (currentUser && currentUser.role === 'admin') {
        toast({
          title: "Admin Login Successful",
          description: "Welcome to the admin panel!",
        });
        setLocation('/admin/dashboard');
      } else {
        toast({
          title: "Access Denied",
          description: "This login is for administrators only.",
          variant: "destructive",
        });
        // Clear token for non-admin users
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Access the administrative panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Enter admin username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Admin Login
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/')}
              className="text-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Admin Access Only</strong><br />
              Contact your system administrator for credentials
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 