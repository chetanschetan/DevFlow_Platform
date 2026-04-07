import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { useState } from 'react';
import {
  ArrowLeft,
  Code,
  User,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Eye,
  Copy,
  Download,
  Search,
  SortAsc,
  SortDesc,
  Loader2,
} from 'lucide-react';

// FIX 1: Slimmer, more realistic interface
interface Submission {
  _id: string;
  studentId: string;
  questionId: string;
  code?: string;
  runCount: number;
  results: any[];
  createdAt: string;
  studentName?: string;
  studentEmail?: string;
  studentUsername?: string;
  questionTitle?: string;
  questionTopic?: string;
  score?: number;
  marksEarned?: number;
  totalMarks?: number;
}

export default function AdminSubmissions() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'student' | 'question'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: submissions, isLoading } = useQuery<Submission[]>({
    queryKey: ['/api/admin/all-submissions'],
    queryFn: async () => {
      const response = await api.admin.getAllSubmissions();
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // FIX 2: Safer filtering with null checks
  const filteredSubmissions = submissions?.filter((sub) => {
    const sName = sub.studentName?.toLowerCase() || '';
    const sEmail = sub.studentEmail?.toLowerCase() || '';
    const qTitle = sub.questionTitle?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch = sName.includes(search) || sEmail.includes(search) || qTitle.includes(search);
    
    // Logic for completion: usually score >= 100 or all cases passed
    const isCompleted = sub.score === 100;
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'completed' && isCompleted) ||
      (filterStatus === 'incomplete' && !isCompleted);
    
    return matchesSearch && matchesFilter;
  }) || [];

  // FIX 3: Robust Sorting
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'date') comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    else if (sortBy === 'score') comp = (a.score || 0) - (b.score || 0);
    else if (sortBy === 'student') comp = (a.studentName || '').localeCompare(b.studentName || '');
    else if (sortBy === 'question') comp = (a.questionTitle || '').localeCompare(b.questionTitle || '');
    
    return sortOrder === 'asc' ? comp : -comp;
  });

  const stats = {
    total: submissions?.length || 0,
    completed: submissions?.filter(s => (s.score || 0) >= 100).length || 0,
    avgScore: submissions?.length 
      ? Math.round(submissions.reduce((acc, s) => acc + (s.score || 0), 0) / submissions.length) 
      : 0
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Master Submissions</h1>
        </div>
        <Badge variant="outline" className="px-4 py-1 text-sm font-mono">
          {stats.total} TOTAL ENTRIES
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Global Pass Rate" value={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%`} icon={TrendingUp} color="blue" />
        <StatCard title="Average Score" value={`${stats.avgScore}%`} icon={CheckCircle} color="green" />
        <StatCard title="Submissions Today" value={stats.total} icon={Clock} color="orange" />
      </div>

      {/* Control Bar */}
      <Card className="mb-6 border-none shadow-sm bg-muted/30">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Filter by student or question..."
              className="w-full pl-10 pr-4 py-2 bg-background border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              className="bg-background border rounded-md px-3 py-2 text-sm outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed (100%)</option>
              <option value="incomplete">Incomplete</option>
            </select>
            <select 
              className="bg-background border rounded-md px-3 py-2 text-sm outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="date">Sort: Recent</option>
              <option value="score">Sort: Score</option>
              <option value="student">Sort: Student</option>
            </select>
            <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {sortedSubmissions.map((sub) => (
          <Card key={sub._id} className="hover:border-primary/40 transition-all group">
            <CardContent className="p-0">
              <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                      {sub.questionTitle || 'Unnamed Question'}
                    </h3>
                    <Badge variant={(sub.score || 0) >= 100 ? "default" : "destructive"}>
                      {(sub.score || 0)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {sub.studentName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold leading-none">{sub.studentName}</p>
                        <p className="text-xs text-muted-foreground mt-1">{sub.studentEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Code className="h-4 w-4" />
                      {sub.runCount} Attempts
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                  <Button variant="outline" size="sm" onClick={() => setLocation(`/admin/students/${sub.studentId}`)}>
                    <User className="h-4 w-4 mr-2" /> Profile
                  </Button>
                </div>
              </div>

              {/* Code details moved to footer for cleaner look */}
              {sub.code && (
                <div className="px-6 pb-6">
                  <details className="border rounded-md bg-muted/20 overflow-hidden">
                    <summary className="p-3 cursor-pointer hover:bg-muted/40 text-sm font-medium flex items-center justify-between">
                      <span className="flex items-center gap-2"><Code className="h-4 w-4" /> View Logic</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(sub.code || '');
                      }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </summary>
                    <pre className="p-4 bg-[#1e1e1e] text-[#d4d4d4] text-xs font-mono overflow-x-auto">
                      <code>{sub.code}</code>
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Internal Stat Component
function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
  };
  return (
    <Card className="border shadow-none">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-xl border ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}