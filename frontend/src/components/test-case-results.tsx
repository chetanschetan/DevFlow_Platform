import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, FileText, Code } from 'lucide-react';

interface TestCaseResult {
  input: string;
  output: string;
  expected: string;
  pass: boolean;
  marks: number;
}

interface TestCaseResultsProps {
  results: TestCaseResult[];
  totalMarks: number;
  marksEarned: number;
  score: number;
  showDetails?: boolean;
}

export function TestCaseResults({ 
  results, 
  totalMarks, 
  marksEarned, 
  score, 
  showDetails = false 
}: TestCaseResultsProps) {
  if (!results || results.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No test cases available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Test Case Results</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted rounded">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{marksEarned}</div>
            <div className="text-sm text-muted-foreground">Marks Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalMarks}</div>
            <div className="text-sm text-muted-foreground">Total Marks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{score}%</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </div>
        </div>

        {/* Individual Test Cases */}
        <div className="space-y-3">
          {results.map((testCase, index) => (
            <div
              key={index}
              className={`p-3 rounded border ${
                testCase.pass ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {testCase.pass ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">Test Case {index + 1}</span>
                  <Badge variant={testCase.pass ? "default" : "destructive"} className="text-xs">
                    {testCase.pass ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {testCase.marks} mark{testCase.marks !== 1 ? 's' : ''}
                </Badge>
              </div>

              {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Input:</div>
                    <div className="p-2 bg-background rounded border font-mono text-xs break-all">
                      {testCase.input || 'No input'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Your Output:</div>
                    <div className="p-2 bg-background rounded border font-mono text-xs break-all">
                      {testCase.output || 'No output'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Expected:</div>
                    <div className="p-2 bg-background rounded border font-mono text-xs break-all">
                      {testCase.expected || 'No expected output'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Performance:</span>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-medium">
                {results.filter(r => r.pass).length} passed
              </span>
              <span className="text-red-600 font-medium">
                {results.filter(r => !r.pass).length} failed
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



