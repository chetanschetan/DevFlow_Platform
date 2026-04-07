import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { TestCaseResults } from '@/components/test-case-results';
import { MonacoEditor } from '@/components/monaco-editor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Play, Send, Save, RotateCcw, Eye, EyeOff, Loader2, Shield, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';

// Type definitions for API responses
interface Assignment {
  _id: string;
  questionId: string;
  title: string;
  description: string;
  marks: number;
  topic: string;
  taxonomyLevel: string;
  questionType?: 'coding' | 'mcq' | 'guess_output'; // Make optional for backward compatibility
  testCases?: Array<{
    input: string;
    expectedOutput: string;
  }>;
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  codeSnippet?: string;
  expectedOutput?: string;
  isVisible: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Submission {
  _id: string;
  studentId: string;
  questionId: string;
  code?: string;
  selectedOption?: string;
  guessedOutput?: string;
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

interface CodeDraft {
  _id: string;
  studentId: string;
  questionId: string;
  code: string;
  lastSaved: string;
  createdAt: string;
  updatedAt: string;
}

interface RunCodeResult {
  type: 'run';
  output: string;
  statusCode: number;
  error?: string;
  passed?: number;
  failed?: number;
  score?: number;
  marksEarned?: number;
  totalMarks?: number;
  testCaseResults?: Array<{
    input: string;
    output: string;
    expected: string;
    pass: boolean;
    marks: number;
  }>;
}

interface SubmitCodeResult {
  type: 'submit';
  message: string;
  passed: number;
  failed: number;
  score: number;
  marksEarned: number;
  totalMarks: number;
  error?: string;
  output?: string;
  testCaseResults?: Array<{
    input: string;
    output: string;
    expected: string;
    pass: boolean;
    marks: number;
  }>;
}

export default function CodingInterface() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get mode from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode'); // 'view', 'retry', or null

  const [code, setCode] = useState(`public class Solution {
    
    public static void main(String[] args) {
        // Your code here
    }
}
`);
  const [results, setResults] = useState<RunCodeResult | SubmitCodeResult | null>(null);
  const [showProblemDetails, setShowProblemDetails] = useState(true);
  const [lastSavedCode, setLastSavedCode] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasRunCode, setHasRunCode] = useState(false);
  const [allTestsPassed, setAllTestsPassed] = useState(false);

  const { data: assignment, isLoading, error } = useQuery<Assignment>({
    queryKey: ['/api/student/assignment', id],
    enabled: !!id,
    retry: 3,
    retryDelay: 1000,
  });

  const { data: submission } = useQuery<Submission | null>({
    queryKey: ['/api/student/submissions', id],
    enabled: !!id,
  });

  const { data: codeDraft } = useQuery<CodeDraft | null>({
    queryKey: ['/api/student/draft', id],
    enabled: !!id && (assignment?.questionType || 'coding') === 'coding',
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache at all (newer version uses gcTime instead of cacheTime)
  });

  // Prefer server-computed latest editor state to avoid stale client merges
  const { data: editorState } = useQuery<{ source: 'draft' | 'submission'; code: string; updatedAt: string } | null>({
    queryKey: ['/api/student/editor-state', id],
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    console.log('Editor state:', editorState);
  }, [editorState]);

  useEffect(() => {
    console.log('Code loading effect triggered:', {
      submission: !!submission,
      codeDraft: !!codeDraft,
      editorState: !!editorState,
      mode,
      assignmentId: assignment?._id
    });

    const questionType = assignment?.questionType || 'coding';
    if (questionType !== 'coding') return;

    // 1) Load from server-computed latest editor state when available
    if (editorState?.code && mode !== 'retry') {
      setCode(editorState.code);
      setLastSavedCode(editorState.code);
      return;
    }

    // 2) Fallbacks (kept for safety)
    if (codeDraft?.code && mode !== 'retry') {
      setCode(codeDraft.code);
      setLastSavedCode(codeDraft.code);
    } else if (submission?.code && mode !== 'retry') {
      setCode(submission.code);
      setLastSavedCode(submission.code);
      setHasRunCode(submission.runCount > 0);
      const lastResult = submission.results[submission.results.length - 1];
      setAllTestsPassed(lastResult ? lastResult.failed === 0 : false);
    } else if (mode === 'retry') {
      setCode(`public class Solution {
    
    public static void main(String[] args) {
        // Your code here
    }
}`);
      setLastSavedCode('');
      setHasRunCode(false);
      setAllTestsPassed(false);
    } else if (mode === 'view' && !submission?.code && !codeDraft?.code) {
      setCode(`public class Solution {
    
    public static void main(String[] args) {
        // Your code here
    }
}`);
    }
  }, [submission, codeDraft, editorState, mode, assignment]);

  const runCodeMutation = useMutation({
    mutationFn: async (data: { code: string; questionId: string; input?: string }) => {
      const response = await api.student.runCode(data);
      return response.json() as Promise<RunCodeResult>;
    },
    onSuccess: (data) => {
      setResults({ ...data, type: 'run' });
      setHasRunCode(true);
      toast({
        title: "Code Executed",
        description: "Your code has been executed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Execution Failed",
        description: error.message || "Failed to execute code",
        variant: "destructive",
      });
    },
  });

  const submitCodeMutation = useMutation({
    mutationFn: async (data: { code: string; questionId: string }) => {
      const response = await api.student.submitCode(data);
      return response.json() as Promise<SubmitCodeResult>;
    },
    onSuccess: (data) => {
      setResults({ ...data, type: 'submit' });
      setAllTestsPassed(data.failed === 0);
      queryClient.invalidateQueries({ queryKey: ['/api/student/submissions', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/my-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/draft', id] });
      toast({
        title: "Code Submitted",
        description: `Score: ${data.score}% (${data.marksEarned}/${data.totalMarks} marks earned)`,
      });
      
      // Redirect to assignments page after 2 seconds
      setTimeout(() => {
        setLocation('/assignments');
      }, 2000);
    },
    onError: (error: any) => {
      const errorData = error.response?.json?.() || error;
      if (errorData.requiresRun) {
        toast({
          title: "Run Required",
          description: "You must run your code at least once before submitting",
          variant: "destructive",
        });
      } else if (errorData.requiresAllTestsPass) {
        toast({
          title: "All Tests Must Pass",
          description: "All test cases must pass before submitting. Please run your code and fix any errors.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: error.message || "Failed to submit code",
          variant: "destructive",
        });
      }
    },
  });

  const autoSaveMutation = useMutation({
    mutationFn: async (data: { code: string; questionId: string }) => {
      const response = await api.student.autoSaveCode(data);
      return response.json();
    },
    onSuccess: () => {
      setLastSavedCode(code);
      setIsAutoSaving(false);
      console.log('Auto-save successful');
    },
    onError: (error: any) => {
      console.error('Auto-save failed:', error);
      setIsAutoSaving(false);
      // Don't show toast for auto-save errors to avoid spam
    },
  });

  const handleRun = () => {
    if (!assignment) return;
    runCodeMutation.mutate({ code, questionId: assignment._id });
  };

  const handleSubmit = () => {
    if (!assignment) return;
    
    if (!hasRunCode) {
      toast({
        title: "Run Required",
        description: "You must run your code at least once before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!allTestsPassed) {
      toast({
        title: "All Tests Must Pass",
        description: "All test cases must pass before submitting. Please run your code and fix any errors.",
        variant: "destructive",
      });
      return;
    }

    submitCodeMutation.mutate({ code, questionId: assignment._id });
  };

  const handleKeyStroke = (key: string) => {
    // Log keystroke for monitoring
    console.log('Keystroke logged:', key, new Date().toISOString());
  };

  // Auto-save effect - save to draft every 30 seconds
  useEffect(() => {
    const questionType = assignment?.questionType || 'coding';
    if (!assignment || !code || code === lastSavedCode || questionType !== 'coding') return;
    
    // Don't auto-save in view mode
    if (mode === 'view') return;

    const timeoutId = setTimeout(() => {
      setIsAutoSaving(true);
      autoSaveMutation.mutate({ code, questionId: assignment._id });
    }, 10000); // Auto-save after 10 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [code, assignment, lastSavedCode, autoSaveMutation, mode]);

  // Update test case status when results change
  useEffect(() => {
    if (results?.type === 'run') {
      setHasRunCode(true);
      // Check if this was a successful run with test cases
      if (results.statusCode === 0 && !results.error) {
        setAllTestsPassed(true);
      } else {
        setAllTestsPassed(false);
      }
    } else if (results?.type === 'submit') {
      setAllTestsPassed(results.failed === 0);
    }
  }, [results]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error loading assignment</h3>
            <p className="text-muted-foreground mb-4">There was an error loading this assignment.</p>
            <p className="text-sm text-red-500 mb-4">{error.message}</p>
            <Button onClick={() => setLocation('/assignments')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Assignment not found</h3>
            <p className="text-muted-foreground mb-4">The assignment you're looking for doesn't exist or is not available.</p>
            <Button onClick={() => setLocation('/assignments')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">{assignment.title || 'Untitled Assignment'}</h1>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {assignment.marks || 0} marks
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {assignment.topic}
          </Badge>
        </div>
        <Button variant="outline" onClick={() => setLocation('/assignments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold text-gray-900">Problem Description</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProblemDetails(!showProblemDetails)}
                >
                  {showProblemDetails ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CardHeader>
            {showProblemDetails && (
              <CardContent>
                <div className="prose max-w-none text-sm">
                  <div 
                    dangerouslySetInnerHTML={{ __html: assignment.description }}
                    className="leading-relaxed"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Test Cases */}
          {assignment.testCases && assignment.testCases.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">Test Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignment.testCases.map((testCase, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <div className="text-sm">
                        <span className="font-medium">Input:</span>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border">{testCase.input}</pre>
                      </div>
                      <div className="text-sm mt-2">
                        <span className="font-medium">Expected Output:</span>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border">{testCase.expectedOutput}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {results && (
            <div className="mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {results.type === 'run' ? 'Code Execution Results' : 'Submission Results'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{results.passed || 0}</div>
                        <div className="text-sm text-muted-foreground">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{results.failed || 0}</div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{results.marksEarned || 0}</div>
                        <div className="text-sm text-muted-foreground">Marks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{results.score || 0}%</div>
                        <div className="text-sm text-muted-foreground">Score</div>
                      </div>
                    </div>

                    {/* Test Case Results */}
                    {results.testCaseResults && results.testCaseResults.length > 0 && (
                      <TestCaseResults
                        results={results.testCaseResults}
                        totalMarks={results.totalMarks || 0}
                        marksEarned={results.marksEarned || 0}
                        score={results.score || 0}
                        showDetails={true}
                      />
                    )}

                    {/* Error Display */}
                    {results.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                        <strong>Error:</strong> {results.error}
                      </div>
                    )}

                    {/* Output Display */}
                    {results.output && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                        <div className="font-medium text-gray-700 mb-2">Output:</div>
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap break-all">
                          {results.output}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submission Status */}
          {submission && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">Submission Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Run Count:</span>
                    <Badge variant="outline">{submission.runCount}</Badge>
                  </div>
                  {submission.results.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Marks Earned:</span>
                      <Badge variant="outline">
                        {submission.results[submission.results.length - 1].marksEarned || 0}/{submission.results[submission.results.length - 1].totalMarks || 0}
                      </Badge>
                    </div>
                  )}
                  {submission.results.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Score:</span>
                      <Badge variant={submission.results[submission.results.length - 1].failed === 0 ? "default" : "destructive"}>
                        {submission.results[submission.results.length - 1].totalMarks > 0 
                          ? `${submission.results[submission.results.length - 1].score || 0}%` 
                          : 'No marks available'
                        }
                      </Badge>
                    </div>
                  )}
                  
                  {/* Show test case results for past submissions */}
                  {submission.results.length > 0 && 
                   submission.results[submission.results.length - 1]?.testCaseResults && 
                   submission.results[submission.results.length - 1]?.testCaseResults!.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <TestCaseResults
                        results={submission.results[submission.results.length - 1]?.testCaseResults!}
                        totalMarks={submission.results[submission.results.length - 1]?.totalMarks || 0}
                        marksEarned={submission.results[submission.results.length - 1]?.marksEarned || 0}
                        score={submission.results[submission.results.length - 1]?.score || 0}
                        showDetails={false}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Code Editor */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-semibold text-gray-900">Java Code Editor</CardTitle>
              <div className="flex items-center gap-2">
                {mode === 'view' && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Eye className="h-3 w-3" />
                    <span>Read-only mode</span>
                  </div>
                )}
                {isAutoSaving && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
                <Shield className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Cheat-Free Mode</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <MonacoEditor
              value={code || ''}
              onChange={setCode}
              height="400px"
              onKeyStroke={handleKeyStroke}
              readOnly={mode === 'view'}
            />
          </CardContent>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              {mode === 'view' ? (
                <Button 
                  onClick={() => setLocation(`/assignments/${id}?mode=retry`)}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start New Attempt
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handleRun}
                  disabled={runCodeMutation.isPending}
                  className="w-full"
                >
                  {runCodeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Code
                </Button>
              )}
            </div>
            
            {/* Execution Results - Right below Run button */}
            {results && results.type === 'run' && (
              <div className="mt-4">
                {results.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 text-red-800">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Error</span>
                    </div>
                    <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{results.error}</pre>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Program Output</span>
                    </div>
                    <pre className="mt-2 text-sm text-green-700 whitespace-pre-wrap min-h-[48px] p-2 bg-white rounded border">
{(results.output && results.output.trim().length > 0) ? results.output : 'No output (your program did not print anything).'}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Submit button - Only show when tests pass */}
            {mode !== 'view' && hasRunCode && (
              <div className="mt-4">
                <Button 
                  onClick={handleSubmit}
                  disabled={submitCodeMutation.isPending}
                  className="w-full"
                >
                  {submitCodeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit
                </Button>
              </div>
            )}
            
            {/* Submission Requirements */}
            {/* Removed run-required notice as requested */}
            
            {hasRunCode && results?.type === 'run' && results.error && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please fix the errors in your code before submitting.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
