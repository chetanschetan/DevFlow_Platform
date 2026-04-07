import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import {
  Users,
  HelpCircle,
  Code,
  TrendingUp,
  Plus,
  Eye,
  Loader2,
} from 'lucide-react';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  // 1. Fetch Questions with queryFn
  const { data: questions, isLoading: loadingQuestions } = useQuery({
    queryKey: ['/api/admin/questions'],
    queryFn: async () => {
      const res = await api.admin.getQuestions();
      return res.json();
    },
  });

  // 2. Fetch Dashboard Stats with queryFn
  const { data: dashboardStats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/admin/dashboard/stats'],
    queryFn: async () => {
      const res = await api.admin.getDashboardStats();
      return res.json();
    },
  });

  // Loading Guard for better UX
  if (loadingQuestions || loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Derive stats with fallbacks
  const stats = {
    totalStudents: dashboardStats?.totalStudents || 0,
    totalQuestions: dashboardStats?.totalQuestions || questions?.length || 0,
    totalSubmissions: dashboardStats?.totalSubmissions || 0,
    passRate: dashboardStats?.passRate || 0,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of platform performance and management</p>
        </div>
        <Button onClick={() => setLocation('/admin/questions/create')}>
          <Plus className="h-4 w-4 mr-2" />
          New Question
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Questions</p>
                <p className="text-2xl font-bold">{stats.totalQuestions}</p>
              </div>
              <HelpCircle className="h-8 w-8 text-green-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submissions</p>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
              </div>
              <Code className="h-8 w-8 text-yellow-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{stats.passRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Questions Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Questions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/questions')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!questions || questions.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">No questions created yet</p>
              <Button 
                variant="outline"
                className="mt-4" 
                onClick={() => setLocation('/admin/questions/create')}
              >
                Create First Question
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {questions.slice(0, 3).map((question: any) => (
                <div key={question._id || question.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div>
                    <h4 className="font-semibold">{question.title}</h4>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span className="bg-muted px-2 py-0.5 rounded">{question.topic}</span>
                      <span>{question.marks} marks</span>
                      <span>{question.testCases?.length || 0} cases</span>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setLocation(`/admin/questions/edit/${question._id || question.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Students Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Users className="h-12 w-12 text-primary/20 mb-4" />
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
              <p className="text-sm text-muted-foreground mb-4">Total Registered Students</p>
              <Button variant="outline" className="w-full" onClick={() => setLocation('/admin/students')}>
                Go to Students Directory
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <TrendingUp className="h-12 w-12 text-blue-500/20 mb-4" />
              <p className="text-3xl font-bold">{stats.passRate}%</p>
              <p className="text-sm text-muted-foreground mb-4">Average Platform Pass Rate</p>
              <Button variant="outline" className="w-full" onClick={() => setLocation('/admin/analytics')}>
                View Detailed Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}