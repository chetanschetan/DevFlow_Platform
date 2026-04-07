import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useLocation } from 'wouter';
import { 
  User, 
  LogOut, 
  Code, 
  Home, 
  BookOpen, 
  FileText, 
  BarChart3, 
  HelpCircle, 
  List,
  Settings,
  Shield,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const publicNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: BookOpen, label: 'About', path: '/about' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : (user ? studentNavItems : publicNavItems);

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Code className="h-8 w-8 mr-3" />
            <span className="text-2xl font-bold">DevFlow</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Navigation Menu */}
            <NavigationMenu>
              <NavigationMenuList>
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.path}>
                    <NavigationMenuLink
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        location === item.path
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
                      }`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Admin Quick Access */}
            {user?.role === 'admin' && (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-primary-foreground/20">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Admin</span>
              </div>
            )}

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <User className="h-4 w-4 mr-2" />
                    {user.firstName} {user.lastName}
                    {user.role === 'admin' && (
                      <Shield className="h-3 w-3 ml-1" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled className="opacity-60">
                    <User className="h-4 w-4 mr-2" />
                    {user.username} ({user.role})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  onClick={() => handleNavigation('/login')}
                >
                  Login
                </Button>
                <Button 
                  variant="secondary" 
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium"
                  onClick={() => handleNavigation('/admin-login')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>

              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-primary-foreground/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`w-full justify-start text-left ${
                    location === item.path
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
                  }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              ))}
              
              {!user && (
                <div className="pt-4 border-t border-primary-foreground/20">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => handleNavigation('/login')}
                  >
                    Login
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start mt-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium"
                    onClick={() => handleNavigation('/admin-login')}
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    Admin
                  </Button>

                </div>
              )}

              {user && (
                <div className="pt-4 border-t border-primary-foreground/20">
                  <div className="px-3 py-2 text-sm text-primary-foreground/60">
                    {user.username} ({user.role})
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
