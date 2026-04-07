import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Eye, Code, Calendar, Award, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useState } from 'react';

export default function Submissions() {
  const [, setLocation] = useLocation();
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['/api/student/my-submissions'],
  });

  const { data: assignments } = useQuery({
    queryKey: ['/api/student/assignments'],
  });

  // Type assertions to fix TypeScript errors
  const submissionsArray = (submissions as any[]) || [];
  const assignmentsArray = (assignments as any[]) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getAssignmentTitle = (questionId: string) => {
    const assignment = assignmentsArray.find((a: any) => a._id === questionId);
    return assignment?.title || 'Unknown Assignment';
  };

  const getAssignmentType = (questionId: string) => {
    const assignment = assignmentsArray.find((a: any) => a._id === questionId);
    return assignment?.questionType || 'coding';
  };

  const calculateBestScore = (results: any[]) => {
    if (!results || results.length === 0) return { score: 0, marksEarned: 0, totalMarks: 0 };
    
    // Find the result with highest marks earned
    const bestResult = results.reduce((best, current) => {
      const currentMarks = current.marksEarned || 0;
      const bestMarks = best.marksEarned || 0;
      return currentMarks > bestMarks ? current : best;
    });
    
    return {
      score: bestResult.score || 0,
      marksEarned: bestResult.marksEarned || 0,
      totalMarks: bestResult.totalMarks || 0
    };
  };

  const getStatusBadge = (marksEarned: number, totalMarks: number) => {
    if (totalMarks === 0) return { variant: "secondary" as const, text: "No Marks" };
    
    const percentage = (marksEarned / totalMarks) * 100;
    if (percentage >= 70) return { variant: "default" as const, text: "Passed" };
    if (percentage >= 50) return { variant: "secondary" as const, text: "Partial" };
    return { variant: "destructive" as const, text: "Failed" };
  };

  const toggleExpanded = (submissionId: string) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Submissions</h1>
        <Button variant="outline" onClick={() => setLocation('/assignments')}>
          <Code className="h-4 w-4 mr-2" />
          View Assignments
        </Button>
      </div>

      {!submissionsArray || submissionsArray.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Code className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start working on assignments to see your submissions here.
            </p>
            <Button onClick={() => setLocation('/assignments')}>
              View Assignments
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissionsArray.map((submission: any) => {
            const latestResult = submission.results?.[submission.results.length - 1];
            const bestResult = calculateBestScore(submission.results);
            const status = getStatusBadge(bestResult.marksEarned, bestResult.totalMarks);
            const questionType = getAssignmentType(submission.questionId);

            return (
              <Card key={submission._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">
                          {getAssignmentTitle(submission.questionId)}
                        </h3>
                        <Badge variant={status.variant}>
                          {status.text}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {questionType === 'coding' ? 'Coding' : questionType === 'mcq' ? 'MCQ' : 'Guess Output'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Marks Earned</p>
                            <p className="font-semibold text-lg">
                              {bestResult.marksEarned}/{bestResult.totalMarks}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {bestResult.totalMarks > 0 ? `(${bestResult.score}%)` : 'No marks available'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Attempts</p>
                            <p className="font-semibold">{submission.results?.length || 0}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Runs</p>
                            <p className="font-semibold">{submission.runCount || 0}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Last Submit</p>
                            <p className="font-semibold">
                              {latestResult 
                                ? new Date(latestResult.timestamp).toLocaleDateString()
                                : 'Never'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {latestResult && questionType === 'coding' && latestResult.testCaseResults && (
                        <div className="mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(submission._id)}
                            className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
                          >
                            {expandedSubmission === submission._id ? 'Hide' : 'Show'} Test Case Details
                          </Button>
                          
                          {expandedSubmission === submission._id && (
                            <div className="mt-3 space-y-2">
                              <div className="text-sm font-medium text-muted-foreground mb-2">
                                Test Case Breakdown:
                              </div>
                              {latestResult.testCaseResults.map((testCase: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                  <div className="flex items-center gap-2">
                                    {testCase.pass ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <span>Test Case {index + 1}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                      {testCase.pass ? 'Passed' : 'Failed'}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {testCase.marks} mark{testCase.marks !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {latestResult && questionType !== 'coding' && (
                        <div className="mt-4 p-3 bg-muted rounded">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Latest Result:</span>
                            <span className="text-sm">
                              {latestResult.passed > 0 ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button
                        variant="outline"
                        onClick={() => setLocation(`/assignments/${submission.questionId}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
