import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { MonacoEditor } from '@/components/monaco-editor';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Play,
  Send,
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  RotateCcw,
  Save,
  AlertTriangle,
} from 'lucide-react';

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
  hideTestCases?: boolean;
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
  testCaseResults?: Array<{
    input: string;
    output: string;
    expected: string;
    pass: boolean;
  }>;
}

interface SubmitCodeResult {
  type: 'submit';
  message: string;
  passed: number;
  failed: number;
  score: number;
  testCaseResults?: Array<{
    input: string;
    output: string;
    expected: string;
    pass: boolean;
  }>;
}

export default function QuestionInterface() {
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
}`);
  const [selectedOption, setSelectedOption] = useState('');
  const [guessedOutput, setGuessedOutput] = useState('');
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
    enabled: !!id && assignment?.questionType === 'coding',
  });

  // Determine question type - default to coding if not specified
  const questionType = assignment?.questionType || 'coding';

  useEffect(() => {
    console.log('Assignment data:', assignment);
    console.log('Question type:', questionType);
    console.log('Question type from assignment:', assignment?.questionType);
    
    if (questionType !== 'coding') {
      return;
    }

    if (submission?.code && mode !== 'retry') {
      setCode(submission.code);
      setLastSavedCode(submission.code);
      setHasRunCode(submission.runCount > 0);
      
      const lastResult = submission.results[submission.results.length - 1];
      setAllTestsPassed(lastResult ? lastResult.failed === 0 : false);
    } else if (codeDraft?.code && mode !== 'retry') {
      setCode(codeDraft.code);
      setLastSavedCode(codeDraft.code);
      setHasRunCode(false);
      setAllTestsPassed(false);
    } else if (mode === 'retry') {
      setCode(`public class Solution {
    
    public static void main(String[] args) {
        // Your code here
    }
}`);
      setLastSavedCode('');
      setHasRunCode(false);
      setAllTestsPassed(false);
    } else {
      // Fresh attempt - reset states
      setHasRunCode(false);
      setAllTestsPassed(false);
    }
  }, [submission, codeDraft, mode, assignment, questionType]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('State changed - hasRunCode:', hasRunCode, 'allTestsPassed:', allTestsPassed);
  }, [hasRunCode, allTestsPassed]);

  const runCodeMutation = useMutation({
    mutationFn: async (data: { code: string; questionId: string; input?: string }) => {
      const response = await api.student.runCode(data);
      return response.json() as Promise<RunCodeResult>;
    },
    onSuccess: (data) => {
      console.log('Run code success:', data);
      setResults({ ...data, type: 'run' });
      setHasRunCode(true);
      
      // Set allTestsPassed based on test results
      if (data.failed !== undefined) {
        console.log('Test results found:', data);
        const testsPassed = data.failed === 0;
        console.log('Setting allTestsPassed to:', testsPassed);
        setAllTestsPassed(testsPassed);
      } else {
        console.log('No test results found, setting allTestsPassed to false');
        setAllTestsPassed(false);
      }
      
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
    mutationFn: async (data: { code?: string; questionId: string; selectedOption?: string; guessedOutput?: string }) => {
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
        title: "Submitted Successfully",
        description: `Score: ${data.score}%`,
      });
      
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
          description: error.message || "Failed to submit",
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
    },
    onError: (error: any) => {
      console.error('Auto-save failed:', error);
      setIsAutoSaving(false);
    },
  });

  const handleRun = () => {
    if (!assignment) return;
    console.log('Run code: assignment._id =', assignment._id);
    console.log('Run code: assignment.questionId =', assignment.questionId);
    runCodeMutation.mutate({ code, questionId: assignment._id });
  };

  const handleSubmit = () => {
    if (!assignment) return;
    
    if (questionType === 'coding') {
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
    } else if (questionType === 'mcq') {
      if (!selectedOption) {
        toast({
          title: "Selection Required",
          description: "Please select an option",
          variant: "destructive",
        });
        return;
      }
      submitCodeMutation.mutate({ selectedOption, questionId: assignment._id });
    } else if (questionType === 'guess_output') {
      if (!guessedOutput.trim()) {
        toast({
          title: "Output Required",
          description: "Please provide your output guess",
          variant: "destructive",
        });
        return;
      }
      submitCodeMutation.mutate({ guessedOutput, questionId: assignment._id });
    }
  };

  const handleKeyStroke = useCallback((key: string) => {
    console.log('Keystroke logged:', key, new Date().toISOString());
  }, []);

  // Auto-save effect for coding questions
  useEffect(() => {
    if (!assignment || !assignment._id || !code || code === lastSavedCode || questionType !== 'coding') return;
    if (mode === 'view') return;

    const timeoutId = setTimeout(() => {
      setIsAutoSaving(true);
      console.log('Auto-save: assignment._id =', assignment._id);
      console.log('Auto-save: assignment.questionId =', assignment.questionId);
      autoSaveMutation.mutate({ code, questionId: assignment._id });
    }, 30000); // Auto-save after 30 seconds

    return () => clearTimeout(timeoutId);
  }, [code, assignment, lastSavedCode, mode, questionType]);

  useEffect(() => {
    if (results?.type === 'run') {
      setHasRunCode(true);
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
      <div className="p-4">
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
      <div className="p-4">
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

  // Handle non-coding questions
  if (questionType !== 'coding') {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">{assignment.title}</h1>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {assignment.marks} marks
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {questionType.toUpperCase()}
            </Badge>
          </div>
          <Button variant="outline" onClick={() => setLocation('/assignments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
                {questionType === 'guess_output' && assignment.codeSnippet && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Code Snippet:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {assignment.codeSnippet}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Answer</CardTitle>
            </CardHeader>
            <CardContent>
              {questionType === 'mcq' && assignment.options && (
                <div className="space-y-3">
                  {assignment.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={option.id}
                        name="mcq-option"
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={option.id} className="text-sm">
                        {option.text}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {questionType === 'guess_output' && (
                <div className="space-y-3">
                  <label htmlFor="output-guess" className="text-sm font-medium">
                    What will be the output?
                  </label>
                  <textarea
                    id="output-guess"
                    value={guessedOutput}
                    onChange={(e) => setGuessedOutput(e.target.value)}
                    className="w-full p-3 border rounded-md"
                    rows={4}
                    placeholder="Enter your output guess..."
                  />
                </div>
              )}
              <Button 
                onClick={handleSubmit}
                disabled={submitCodeMutation.isPending}
                className="w-full mt-4"
              >
                {submitCodeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit Answer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Coding question interface
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">{assignment.title}</h1>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {assignment.marks} marks
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
                  <div dangerouslySetInnerHTML={{ __html: assignment.description }} />
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
                        {assignment.hideTestCases ? (
                          <div className="mt-1 text-xs bg-gray-100 p-2 rounded border text-gray-500 italic">
                            Hidden - Test your solution with various inputs
                          </div>
                        ) : (
                          <pre className="mt-1 text-xs bg-white p-2 rounded border">{testCase.input}</pre>
                        )}
                      </div>
                      <div className="text-sm mt-2">
                        <span className="font-medium">Expected Output:</span>
                        {assignment.hideTestCases ? (
                          <div className="mt-1 text-xs bg-gray-100 p-2 rounded border text-gray-500 italic">
                            Hidden - Your code will be tested automatically
                          </div>
                        ) : (
                          <pre className="mt-1 text-xs bg-white p-2 rounded border">{testCase.expectedOutput}</pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {assignment.hideTestCases && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">Test cases are hidden</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Input and expected output details are hidden to encourage proper problem-solving. 
                      Your code will be tested automatically with various inputs.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
              height="500px"
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
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleRun}
                    disabled={runCodeMutation.isPending}
                  >
                    {runCodeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run Code
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitCodeMutation.isPending || !hasRunCode}
                  >
                    {submitCodeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit
                  </Button>
                </>
              )}
            </div>
            
            {/* Submission Requirements */}
            {!hasRunCode && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You must run your code at least once before submitting.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Test Case Results - Moved here below the buttons */}
            {results && results.type === 'run' && results.testCaseResults && results.testCaseResults.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-sm mb-3 text-gray-900">Test Case Results:</h4>
                <div className="space-y-3">
                  {results.testCaseResults.map((testCase: any, index: number) => (
                    <div key={index} className={`p-3 rounded-md border ${testCase.pass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {testCase.pass ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">Test Case {index + 1}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="font-medium">Input:</span>
                          <pre className="mt-1 bg-white p-2 rounded border">{testCase.input}</pre>
                        </div>
                        <div>
                          <span className="font-medium">Expected:</span>
                          <pre className="mt-1 bg-white p-2 rounded border">{testCase.expected}</pre>
                        </div>
                        <div>
                          <span className="font-medium">Output:</span>
                          <pre className="mt-1 bg-white p-2 rounded border">{testCase.output}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              {results.type === 'run' ? 'Execution Results' : 'Submission Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.type === 'run' ? (
              <div className="space-y-4">
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
                      <span className="font-medium">Success</span>
                    </div>
                    <pre className="mt-2 text-sm text-green-700 whitespace-pre-wrap">{results.output}</pre>
                  </div>
                )}
                

              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Passed: {results.passed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium">Failed: {results.failed}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={results.failed === 0 ? "default" : "destructive"}>
                      Score: {results.score}%
                    </Badge>
                  </div>
                </div>


              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 