import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  HelpCircle,
  Filter,
  Loader2,
} from 'lucide-react';

export default function ManageQuestions() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null); // For global Delete Modal
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // FIX 1: Added queryFn to actually fetch data
  const { data: questions, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/questions'],
    queryFn: async () => {
      const res = await api.admin.getQuestions();
      return res.json();
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.admin.deleteQuestion(id);
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      toast({ title: "Deleted", description: "Question removed successfully" });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredQuestions = questions?.filter((q: any) => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = !topicFilter || q.topic === topicFilter;
    return matchesSearch && matchesTopic;
  }) || [];

  const uniqueTopics = Array.from(new Set(questions?.map((q: any) => q.topic) || []));

  if (isLoading) {
    return <div className="p-6"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Question Bank</h1>
        <Button onClick={() => setLocation('/admin/questions/create')}>
          <Plus className="h-4 w-4 mr-2" /> New Question
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                {topicFilter || 'All Topics'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTopicFilter('')}>All Topics</DropdownMenuItem>
              {uniqueTopics.map((topic: any) => (
                <DropdownMenuItem key={topic} onClick={() => setTopicFilter(topic)}>{topic}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((question: any) => (
          <Card key={question._id || question.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6 flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{question.title}</h3>
                  <Badge variant={question.isVisible ? "default" : "outline"}>
                    {question.isVisible ? 'Public' : 'Draft'}
                  </Badge>
                  <Badge variant="secondary">{question.topic}</Badge>
                </div>
                <div 
                  className="text-sm text-muted-foreground line-clamp-1" 
                  dangerouslySetInnerHTML={{ __html: question.description }} 
                />
                <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                  <span>ID: {question.questionId}</span>
                  <span>Marks: {question.marks}</span>
                  <span>Cases: {question.testCases?.length || 0}</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocation(`/admin/questions/edit/${question._id}`)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={() => setDeleteId(question._id)} // FIX 2: Trigger Global Modal
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Delete Confirmation Modal */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the question and all associated student submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteQuestionMutation.mutate(deleteId)}
            >
              {deleteQuestionMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}