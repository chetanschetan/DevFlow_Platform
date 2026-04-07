import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Code, Eye, RotateCcw, BookOpen, CheckSquare, FileText } from 'lucide-react';

export default function Assignments() {
  const [, setLocation] = useLocation();

  const { data: assignments, isLoading } = useQuery<any[]>({
    queryKey: ['/api/student/assignments'],
  });

  const { data: submissions } = useQuery<any[]>({
    queryKey: ['/api/student/my-submissions'],
  });

  const getQuestionTypeIcon = (questionType: string) => {
    switch (questionType) {
      case 'coding':
        return <Code className="h-4 w-4" />;
      case 'mcq':
        return <CheckSquare className="h-4 w-4" />;
      case 'guess_output':
        return <FileText className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const getQuestionTypeLabel = (questionType: string) => {
    switch (questionType) {
      case 'coding':
        return 'Coding';
      case 'mcq':
        return 'MCQ';
      case 'guess_output':
        return 'Guess Output';
      default:
        return 'Coding';
    }
  };

  const getActionButton = (assignment: any, isCompleted: boolean) => {
    if (isCompleted) {
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/assignments/${assignment._id}?mode=view`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/assignments/${assignment._id}?mode=retry`)}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </>
      );
    }

    const questionType = assignment.questionType || 'coding';
    const buttonText = questionType === 'coding' ? 'Start Coding' : 'Start';
    const buttonIcon = getQuestionTypeIcon(questionType);

    return (
      <Button onClick={() => setLocation(`/assignments/${assignment._id}`)}>
        {buttonIcon}
        <span className="ml-1">{buttonText}</span>
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">All</Button>
          <Button variant="ghost" size="sm">Pending</Button>
          <Button variant="ghost" size="sm">Completed</Button>
        </div>
      </div>

      {assignments?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
            <p className="text-muted-foreground text-center">
              Check back later for new assignments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments?.map((assignment: any) => {
            const submission = submissions?.find((s: any) => s.questionId === assignment._id);
            const isCompleted = submission && submission.results?.length > 0;
            const latestResult = submission?.results?.[submission.results.length - 1];

            return (
              <Card key={assignment._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      <Badge variant={isCompleted ? "default" : "secondary"}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getQuestionTypeIcon(assignment.questionType || 'coding')}
                        {getQuestionTypeLabel(assignment.questionType || 'coding')}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {assignment.marks} marks
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold mb-2">{assignment.title}</h3>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {assignment.description?.replace(/<[^>]*>/g, '').substring(0, 150)}
                    {assignment.description?.length > 150 ? '...' : ''}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline">{assignment.topic}</Badge>
                      <Badge variant="outline">{assignment.taxonomyLevel}</Badge>
                    </div>
                    <div className="flex gap-2">
                      {getActionButton(assignment, isCompleted)}
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Marks Earned:</span>
                        <span className="font-semibold">{latestResult.marksEarned || 0}/{latestResult.totalMarks || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-semibold">
                          {latestResult.totalMarks > 0 ? `${latestResult.score || 0}%` : 'No marks available'}
                        </span>
                      </div>
                      {(assignment.questionType || 'coding') === 'coding' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Test Cases:</span>
                          <span>{latestResult.passed}/{latestResult.passed + latestResult.failed} passed</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
