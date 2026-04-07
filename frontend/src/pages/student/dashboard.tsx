import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import {
  BookOpen,
  CheckCircle,
  Star,
  Play,
  Clock,
  Code,
  Eye,
  Loader2,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // 1. Fetch Assignments with explicit queryFn
  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['/api/student/assignments'],
    queryFn: async () => {
      const res = await api.student.getAssignments();
      return res.json();
    },
  });

  // 2. Fetch Submissions with explicit queryFn
    const { data: submissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ['/api/student/my-submissions'],
    queryFn: async () => {
      // FIX: Changed from getSubmission() to getMySubmissions()
      // getMySubmissions takes 0 arguments and returns the full list
      const res = await api.student.getMySubmissions(); 
      return res.json();
    },
  });

  // Loading State Guard
  if (loadingAssignments || loadingSubmissions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- STATS CALCULATIONS ---
  const totalAssignments = assignments?.length || 0;
  const completedAssignments = submissions?.length || 0;
  
  // Calculate Total Runs across all submissions
  const totalRuns = submissions?.reduce((sum: number, sub: any) => sum + (sub.runCount || 0), 0) || 0;
  
  // Calculate Marks Logic
  const totalEarnedMarks = submissions?.reduce((sum: number, sub: any) => {
    const latestResult = sub.results?.[sub.results.length - 1];
    return sum + (latestResult?.marksEarned || 0);
  }, 0) || 0;

  const totalPossibleMarks = submissions?.reduce((sum: number, sub: any) => {
    const latestResult = sub.results?.[sub.results.length - 1];
    return sum + (latestResult?.totalMarks || 0);
  }, 0) || 0;

  const avgPercentage = totalPossibleMarks > 0 
    ? Math.round((totalEarnedMarks / totalPossibleMarks) * 100) 
    : 0;

  // --- RECENT ACTIVITY MAPPING ---
  // Fix: Mapping sub.questionId to a._id or a.id
  const recentActivities = submissions?.slice(0, 3).map((sub: any) => {
    const latestResult = sub.results?.[sub.results.length - 1];
    const assignment = assignments?.find((a: any) => (a._id || a.id) === sub.questionId);
    
    return {
      type: 'submit',
      title: `Submitted "${assignment?.title || 'Assignment'}"`,
      description: `Score: ${latestResult?.passed || 0}/${(latestResult?.passed || 0) + (latestResult?.failed || 0)} test cases passed`,
      timestamp: latestResult?.timestamp ? new Date(latestResult.timestamp) : new Date(),
    };
  }) || [];

  interface DashboardActivity {
    title: string;
    description: string;
    timestamp: Date;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName}!</p>
        </div>
        <Badge variant="secondary" className="text-base px-3 py-1">
          Java Programming
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assignments</p>
                <p className="text-2xl font-bold">{totalAssignments}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedAssignments}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <p className="text-2xl font-bold">{Math.round(totalEarnedMarks)}/{Math.round(totalPossibleMarks)}</p>
                <p className="text-xs text-muted-foreground font-semibold text-primary">{avgPercentage}% Accuracy</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Code Runs</p>
                <p className="text-2xl font-bold">{totalRuns}</p>
              </div>
              <Play className="h-8 w-8 text-blue-500 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments?.slice(0, 4).map((assignment: any) => {
              const submission = submissions?.find((s: any) => s.questionId === (assignment._id || assignment.id));
              const isCompleted = submission && submission.results?.length > 0;
              const latestResult = submission?.results?.[submission.results.length - 1];

              return (
                <Card key={assignment._id || assignment.id} className={`border-l-4 ${isCompleted ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{assignment.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {isCompleted 
                            ? `Score: ${latestResult.marksEarned || 0}/${latestResult.totalMarks || 0}` 
                            : 'Status: Pending Submission'}
                        </p>
                        <Badge 
                          variant={isCompleted ? "default" : "secondary"}
                          className={isCompleted ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"}
                        >
                          {isCompleted ? 'Completed' : 'Action Required'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        onClick={() => setLocation(`/assignments/${assignment._id || assignment.id}`)}
                      >
                        {isCompleted ? (
                          <><Eye className="h-4 w-4 mr-2" /> Review</>
                        ) : (
                          <><Code className="h-4 w-4 mr-2" /> Solve Now</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
  <div className="space-y-6">
    {recentActivities.length > 0 ? (
      // FIX: Add the Type ': DashboardActivity' to the parameter
      recentActivities.map((activity: DashboardActivity, index: number) => (
        <div key={`activity-${index}`} className="flex gap-4 items-start relative pb-6 last:pb-0">
          {/* Visual Timeline Line */}
          {index !== recentActivities.length - 1 && (
            <div className="absolute left-2 top-8 w-0.5 h-full bg-border" />
          )}
          <div className="mt-1 h-4 w-4 rounded-full bg-primary shrink-0" />
          <div className="flex justify-between w-full">
            <div>
              <h4 className="font-semibold leading-none">{activity.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
              {/* Ensure timestamp exists before calling toLocaleDateString */}
              {activity.timestamp instanceof Date 
                ? activity.timestamp.toLocaleDateString() 
                : 'Recent'}
            </span>
          </div>
        </div>
      ))
    ) : (
      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
        <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p>No submission history found.</p>
      </div>
    )}
  </div>
</CardContent>
      </Card>
    </div>
  );
}