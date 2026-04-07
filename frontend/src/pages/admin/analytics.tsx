// import * as React from 'react';
// import { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { api } from '@/lib/api';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   LineChart,
//   Line,
// } from 'recharts';
// import {
//   TrendingUp,
//   TrendingDown,
//   Users,
//   Award,
//   Clock,
//   Target,
//   Download,
//   Loader2,
// } from 'lucide-react';

// const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--destructive))', 'hsl(var(--warning))'];

// // FIX 1: Properly Type the StatCard Props
// interface StatCardProps {
//   title: string;
//   value: string | number;
//   change?: number;
//   icon: React.ElementType;
// }

// const StatCard = ({ title, value, change, icon: Icon }: StatCardProps) => (
//   <Card>
//     <CardContent className="p-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm font-medium text-muted-foreground">{title}</p>
//           <p className="text-2xl font-bold">{value}</p>
//           {change !== undefined && (
//             <div className={`flex items-center text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//               {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
//               {Math.abs(change)}% from last period
//             </div>
//           )}
//         </div>
//         <Icon className="h-8 w-8 text-primary opacity-75" />
//       </div>
//     </CardContent>
//   </Card>
// );

// export default function Analytics() {
//   const [timeRange, setTimeRange] = useState('30d');
//   const [selectedQuestion, setSelectedQuestion] = useState('all');

//   const { data: questions, isLoading: loadingQuestions } = useQuery({
//     queryKey: ['/api/admin/questions'],
//     queryFn: async () => {
//       const res = await api.admin.getQuestions();
//       return res.json();
//     }
//   });

//   // FIX 2: Memoize analytics data to prevent unnecessary re-renders
//   const analyticsData = React.useMemo(() => ({
//     overview: {
//       totalStudents: 45,
//       activeStudents: 38,
//       totalSubmissions: 347,
//       averageScore: 78,
//       trends: { students: 12, submissions: 23, score: -2 }
//     },
//     // Fix: Handle null questions and use consistent ID naming
//     questionStats: questions?.map((q: any) => ({
//       id: q._id || q.id,
//       title: q.title,
//       totalAttempts: Math.floor(Math.random() * 50) + 10,
//       successRate: Math.floor(Math.random() * 40) + 60,
//       averageScore: Math.floor(Math.random() * 30) + 70,
//       averageTime: Math.floor(Math.random() * 60) + 30,
//     })) || [],
//     submissionTrends: [
//       { date: 'Jan 01', submissions: 12, passed: 8 },
//       { date: 'Jan 02', submissions: 15, passed: 11 },
//       { date: 'Jan 03', submissions: 18, passed: 14 },
//       { date: 'Jan 04', submissions: 22, passed: 16 },
//       { date: 'Jan 05', submissions: 19, passed: 15 },
//     ],
//     scoreDistribution: [
//       { range: '90-100%', count: 45, percentage: 25 },
//       { range: '80-89%', count: 67, percentage: 37 },
//       { range: '70-79%', count: 42, percentage: 23 },
//       { range: '60-69%', count: 18, percentage: 10 },
//       { range: '0-59%', count: 9, percentage: 5 },
//     ],
//     topicPerformance: [
//       { topic: 'Arrays', attempts: 89, avgScore: 82 },
//       { topic: 'Loops', attempts: 76, avgScore: 78 },
//       { topic: 'Strings', attempts: 65, avgScore: 75 },
//     ],
//   }), [questions]);

//   if (loadingQuestions) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">Admin Insights</h1>
//         <div className="flex gap-2">
//           <Select value={timeRange} onValueChange={setTimeRange}>
//             <SelectTrigger className="w-40">
//               <SelectValue placeholder="Time Range" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="7d">Last 7 days</SelectItem>
//               <SelectItem value="30d">Last 30 days</SelectItem>
//               <SelectItem value="1y">Last year</SelectItem>
//             </SelectContent>
//           </Select>
//           <Button variant="outline">
//             <Download className="h-4 w-4 mr-2" /> Export CSV
//           </Button>
//         </div>
//       </div>

//       {/* Overview Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
//         <StatCard title="Total Students" value={analyticsData.overview.totalStudents} change={analyticsData.overview.trends.students} icon={Users} />
//         <StatCard title="Active Users" value={analyticsData.overview.activeStudents} icon={Users} />
//         <StatCard title="Submissions" value={analyticsData.overview.totalSubmissions} change={analyticsData.overview.trends.submissions} icon={Target} />
//         <StatCard title="Class Average" value={`${analyticsData.overview.averageScore}%`} change={analyticsData.overview.trends.score} icon={Award} />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//         <Card>
//           <CardHeader><CardTitle>Submission Trends</CardTitle></CardHeader>
//           <CardContent>
//             <ResponsiveContainer width="100%" height={300}>
//               <LineChart data={analyticsData.submissionTrends}>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip contentStyle={{ borderRadius: '8px' }} />
//                 <Line type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Total" />
//                 <Line type="monotone" dataKey="passed" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Passed" />
//               </LineChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader>
//           <CardContent>
//             <ResponsiveContainer width="100%" height={300}>
//               <PieChart>
//                 <Pie
//                   data={analyticsData.scoreDistribution}
//                   cx="50%" cy="50%"
//                   innerRadius={60} outerRadius={80}
//                   paddingAngle={5}
//                   dataKey="count"
//                 >
//                   {analyticsData.scoreDistribution.map((_, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//               </PieChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//       </div>

//       <Card className="mb-6">
//         <CardHeader><CardTitle>Performance by Topic</CardTitle></CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={analyticsData.topicPerformance}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} />
//               <XAxis dataKey="topic" />
//               <YAxis />
//               <Tooltip />
//               <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Avg Score" />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <div className="flex justify-between items-center">
//             <CardTitle>Question Performance</CardTitle>
//             <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
//               <SelectTrigger className="w-56">
//                 <SelectValue placeholder="Filter Question" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Questions</SelectItem>
//                 {questions?.map((q: any) => (
//                   <SelectItem key={q._id || q.id} value={q._id || q.id}>{q.title}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="rounded-md border">
//             <table className="w-full text-sm">
//               <thead className="bg-muted/50 border-b">
//                 <tr>
//                   <th className="text-left p-3">Question Title</th>
//                   <th className="text-left p-3">Attempts</th>
//                   <th className="text-left p-3">Success Rate</th>
//                   <th className="text-left p-3">Avg Score</th>
//                   <th className="text-left p-3">Avg Time</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {analyticsData.questionStats.map((stat: any, index: number) => (
//                   <tr key={index} className="border-b transition-colors hover:bg-muted/30">
//                     <td className="p-3 font-medium">{stat.title}</td>
//                     <td className="p-3">{stat.totalAttempts}</td>
//                     <td className="p-3">
//                       <Badge variant={stat.successRate >= 75 ? "default" : "secondary"}>
//                         {stat.successRate}%
//                       </Badge>
//                     </td>
//                     <td className="p-3">{stat.averageScore}%</td>
//                     <td className="p-3 flex items-center text-muted-foreground">
//                       <Clock className="h-3 w-3 mr-1" /> {stat.averageTime}m
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// frontend/src/pages/admin/Analytics.tsx
import * as React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Clock,
  Target,
  Download,
  Loader2,
} from 'lucide-react';

const COLORS = ['hsl(var(--primary))', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'];

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
}

const StatCard = ({ title, value, change, icon: Icon }: StatCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(change)}% from last period
            </div>
          )}
        </div>
        <Icon className="h-8 w-8 text-primary opacity-75" />
      </div>
    </CardContent>
  </Card>
);

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedQuestion, setSelectedQuestion] = useState('all');

  // Fetch real analytics data
  // frontend/src/pages/admin/Analytics.tsx

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['/api/admin/analytics', timeRange],
    queryFn: async () => {
      // Wait for the apiRequest to finish first
      const response = await api.admin.getAnalytics(timeRange); 
      
      // Then wait for the JSON parsing to finish
      const data = await response.json(); 
      
      return data;
    }
  });

  // Fetch questions for filter
  const { data: questions } = useQuery({
    queryKey: ['/api/admin/questions'],
    queryFn: async () => {
      const res = await api.admin.getQuestions();
      return res.json();
    }
  });

  if (loadingAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Data Normalization from Backend
  const overview = analytics?.overview || { totalStudents: 0, activeStudents: 0, totalSubmissions: 0, averageScore: 0, trends: {} };
  const questionStats = analytics?.questionStats || [];
  const submissionTrends = analytics?.submissionTrends || [];
  const scoreDistribution = analytics?.scoreDistribution || [];
  const topicPerformance = analytics?.topicPerformance || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Insights</h1>
          <p className="text-muted-foreground">Deep dive into student performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Students" value={overview.totalStudents} change={overview.trends?.students} icon={Users} />
        <StatCard title="Active Users" value={overview.activeStudents} icon={Users} />
        <StatCard title="Submissions" value={overview.totalSubmissions} change={overview.trends?.submissions} icon={Target} />
        <StatCard title="Class Average" value={`${overview.averageScore}%`} change={overview.trends?.score} icon={Award} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Submission Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={submissionTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="passed" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scoreDistribution}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="range"
                >
                  {/* FIX: Removed unused '_' parameter to stop the error */}
                  {scoreDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Performance by Topic</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topicPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="topic" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Detailed Question Performance</CardTitle>
            <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter Question" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Questions</SelectItem>
                {questions?.map((q: any) => (
                  <SelectItem key={q._id} value={q._id}>{q.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Attempts</th>
                  <th className="text-left p-4">Success Rate</th>
                  <th className="text-left p-4">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {questionStats
                  .filter((s: any) => selectedQuestion === 'all' || s.id === selectedQuestion)
                  .map((stat: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-medium">{stat.title}</td>
                    <td className="p-4">{stat.totalAttempts}</td>
                    <td className="p-4">
                      <Badge variant={stat.successRate >= 75 ? "default" : "secondary"}>
                        {stat.successRate}%
                      </Badge>
                    </td>
                    <td className="p-4">{stat.averageScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}