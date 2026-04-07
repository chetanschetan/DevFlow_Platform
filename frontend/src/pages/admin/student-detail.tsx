import * as React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { PDFGenerator } from '@/lib/pdf-generator';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  Code,
  User,
  Mail,
  Activity,
  TrendingUp,
  Loader2,
  Copy,
} from 'lucide-react';

// --- TYPES ---
interface StudentSubmission {
  _id: string;
  questionId: string;
  code?: string;
  runCount: number;
  results: Array<{
    timestamp: string;
    passed: number;
    failed: number;
    score: number;
    marksEarned: number;
    totalMarks: number;
    testCaseResults?: Array<{
      input: string;
      output: string;
      expected: string;
      pass: boolean;
      marks: number;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function StudentDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // 1. Data Fetching Hooks
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['/api/admin/student', id],
    queryFn: async () => {
      const response = await api.admin.getStudent(id!);
      return response.json();
    },
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery<StudentSubmission[]>({
    queryKey: ['/api/admin/student-submissions', id],
    queryFn: async () => {
      const response = await api.admin.getStudentSubmissions(id!);
      return response.json();
    },
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/admin/questions'],
    queryFn: async () => {
      const response = await api.admin.getQuestions();
      return response.json();
    },
  });

  // 2. Loading Guard
  if (studentLoading || submissionsLoading || questionsLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 3. Not Found Guard
  if (!student) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-bold">Student Not Found</h3>
        <Button onClick={() => setLocation('/admin/students')} className="mt-4">
          Back to List
        </Button>
      </div>
    );
  }

  // --- LOGIC SECTION ---
  
  // FIX: Type Narrowing - Ensure we have an array to prevent "possibly undefined" errors
  const submissionList = submissions || [];
  const questionList = questions || [];

  const getQuestionDetails = (qId: string) => 
    questionList.find((q: any) => (q._id || q.id) === qId);

  const totalSubmissions = submissionList.length;
  
  const completedQuestions = submissionList.filter((s) => 
    s.results?.some(r => r.failed === 0)
  ).length;

  // FIX: Safe Aggregation logic
  const totalScoreSum = submissionList.reduce((acc, s) => {
    const latest = s.results?.[s.results.length - 1];
    return acc + (latest?.score || 0);
  }, 0);
  
  const averageScore = totalSubmissions > 0 ? Math.round(totalScoreSum / totalSubmissions) : 0;

  const totalCodeRuns = submissionList.reduce((acc, s) => acc + (s.runCount || 0), 0);

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const response = await api.admin.generateStudentPDF(id!);
      const pdfContent = await response.json();
      const pdfGenerator = new PDFGenerator();
      pdfGenerator.downloadPDF(pdfContent, `${student.username}_report.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => setLocation('/admin/students')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Students
        </Button>
        <Button onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
          {isGeneratingPDF ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {isGeneratingPDF ? 'Generating...' : 'Download Report'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Student Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center py-4 border-b">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{student.firstName} {student.lastName}</h2>
              <p className="text-sm text-muted-foreground">@{student.username}</p>
            </div>
            
            <div className="space-y-3 pt-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" /> Email
                </span>
                <span className="font-medium">{student.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-3 w-3" /> Status
                </span>
                <Badge variant={student.isVerified ? "default" : "secondary"}>
                  {student.isVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              {student.createdAt && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Joined
                  </span>
                  <span className="font-medium">{new Date(student.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsBox label="Submissions" value={totalSubmissions} icon={Code} color="blue" />
            <StatsBox label="Solved" value={completedQuestions} icon={CheckCircle} color="green" />
            <StatsBox label="Avg Score" value={`${averageScore}%`} icon={TrendingUp} color="orange" />
            <StatsBox label="Total Runs" value={totalCodeRuns} icon={Activity} color="purple" />
          </div>

          {/* History Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Submission History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalSubmissions === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg opacity-50">
                  <Code className="mx-auto mb-2 h-8 w-8" />
                  <p>No submission history available for this student.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissionList.map((submission) => {
                    const question = getQuestionDetails(submission.questionId);
                    const latest = submission.results?.[submission.results.length - 1];
                    
                    return (
                      <div key={submission._id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-card">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-lg">{question?.title || 'Unknown Assignment'}</h4>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-[10px] uppercase">{question?.topic || 'General'}</Badge>
                              <span className="text-xs text-muted-foreground">{submission.runCount} total runs</span>
                            </div>
                          </div>
                          <Badge variant={latest?.failed === 0 ? "default" : "destructive"} className="px-3">
                            {latest?.marksEarned || 0}/{latest?.totalMarks || 0} Marks
                          </Badge>
                        </div>

                        {/* Expandable Code Section */}
                        {submission.code && (
                          <details className="text-sm bg-muted/50 border rounded-md group overflow-hidden">
                            <summary className="p-2 cursor-pointer font-medium text-primary hover:bg-muted transition-colors flex items-center gap-2">
                              <Code className="h-4 w-4" /> View Submitted Code
                            </summary>
                            <div className="relative">
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="absolute right-2 top-2 h-8 w-8 bg-background/50 hover:bg-background"
                                 onClick={(e) => {
                                   e.preventDefault();
                                   navigator.clipboard.writeText(submission.code || '');
                                 }}
                               >
                                 <Copy className="h-4 w-4" />
                               </Button>
                               <pre className="p-4 bg-[#1e1e1e] text-[#d4d4d4] text-xs font-mono overflow-x-auto leading-relaxed">
                                <code>{submission.code}</code>
                               </pre>
                            </div>
                          </details>
                        )}
                        
                        <div className="mt-3 text-[10px] text-muted-foreground text-right">
                          Last activity: {new Date(submission.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Stats Sub-component
 */
function StatsBox({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  // Map color names to Tailwind utility classes
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <Card className="text-center p-4 shadow-sm border-none bg-background">
      <div className={`mx-auto p-2 rounded-full w-fit mb-2 border ${colorMap[color] || ""}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{label}</p>
    </Card>
  );
}