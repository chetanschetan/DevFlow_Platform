import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import {
  Home,
  BookOpen,
  Code,
  FileText,
  Users,
  BarChart3,
  List,
  HelpCircle,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const studentNavItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Assignments', path: '/assignments' },
    { icon: FileText, label: 'My Submissions', path: '/submissions' },
  ];

  const adminNavItems = [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: HelpCircle, label: 'Questions', path: '/admin/questions' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: List, label: 'All Submissions', path: '/admin/submissions' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : studentNavItems;

  return (
    <div className={cn("pb-12 min-h-screen bg-muted/50 border-r", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location === item.path ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setLocation(item.path)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
