import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'admin';
  course?: string;
  section?: string;
  registerDate?: string | Date;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user = null, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const res = await api.auth.me();
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await api.auth.login({ username, password });
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // queryClient.setQueryData(['/api/auth/me'], data.user);
      queryClient.setQueryData<User>(['/api/auth/me'], data.user);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.clear();
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
  };

  // Set up axios interceptor for authentication
  useEffect(() => {
    if (token) {
      // Store token for future requests
      localStorage.setItem('token', token);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
