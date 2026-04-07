import * as React from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Loader2 } from "lucide-react";

// Auth pages
import Login from "@/pages/auth/login";
import VerifyEmail from "@/pages/auth/verify-email";
import AdminLogin from "@/pages/auth/admin-login";

// Public pages
import Home from "@/pages/home";
import About from "@/pages/about";

// Student pages
import StudentDashboard from "@/pages/student/dashboard";
import Assignments from "@/pages/student/assignments";
import QuestionInterface from "@/pages/student/question-interface";
import Submissions from "@/pages/student/submissions";

// Profile page
import Profile from "@/pages/profile";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import ManageQuestions from "@/pages/admin/manage-questions";
import CreateQuestion from "@/pages/admin/create-question";
import Analytics from "@/pages/admin/analytics";
import AdminStudents from "@/pages/admin/students";
import StudentDetail from "@/pages/admin/student-detail";
import AdminSubmissions from "@/pages/admin/submissions";

import NotFound from "@/pages/not-found";

/**
 * Loading Spinner Component
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {children}
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  if (user) {
    return <Redirect to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />;
  }

  return <>{children}</>;
}

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Switch>
          {/* Root Path Logic */}
          <Route path="/">
            {() => {
              if (isLoading) return <PageLoader />;
              if (user) return <Redirect to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />;
              return <Home />;
            }}
          </Route>
          
          <Route path="/about" component={About} />

          {/* Auth Routes */}
          <Route path="/login">
            <PublicRoute><Login /></PublicRoute>
          </Route>
          <Route path="/verify-email">
            <PublicRoute><VerifyEmail /></PublicRoute>
          </Route>
          <Route path="/admin-login">
            <PublicRoute><AdminLogin /></PublicRoute>
          </Route>

          {/* Student Routes */}
          <Route path="/dashboard">
            <ProtectedRoute><StudentDashboard /></ProtectedRoute>
          </Route>
          <Route path="/assignments">
            <ProtectedRoute><Assignments /></ProtectedRoute>
          </Route>
          <Route path="/assignments/:id">
            <ProtectedRoute><QuestionInterface /></ProtectedRoute>
          </Route>
          <Route path="/submissions">
            <ProtectedRoute><Submissions /></ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute><Profile /></ProtectedRoute>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/dashboard">
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
          </Route>
          <Route path="/admin/questions">
            <ProtectedRoute adminOnly><ManageQuestions /></ProtectedRoute>
          </Route>
          <Route path="/admin/questions/create">
            <ProtectedRoute adminOnly><CreateQuestion /></ProtectedRoute>
          </Route>
          {/* Edit Question */}
          <Route path="/admin/questions/edit/:id">
             <ProtectedRoute adminOnly><CreateQuestion /></ProtectedRoute>
          </Route>
          <Route path="/admin/analytics">
            <ProtectedRoute adminOnly><Analytics /></ProtectedRoute>
          </Route>
          <Route path="/admin/submissions">
            <ProtectedRoute adminOnly><AdminSubmissions /></ProtectedRoute>
          </Route>
          <Route path="/admin/students">
            <ProtectedRoute adminOnly><AdminStudents /></ProtectedRoute>
          </Route>
          <Route path="/admin/students/:id">
            <ProtectedRoute adminOnly><StudentDetail /></ProtectedRoute>
          </Route>

          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;