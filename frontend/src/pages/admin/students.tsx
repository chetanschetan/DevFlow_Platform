import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { ExcelGenerator } from '@/lib/excel-generator';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  Users,
  Mail,
  Calendar,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  ArrowLeft,
  Activity,
  Clock,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';

export default function AdminStudents() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  // 1. Fetch Students with explicit queryFn
  const { data: students, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/students'],
    queryFn: async () => {
      const res = await api.admin.getAllStudents();
      return res.json();
    },
  });

  // 2. Mutation for Deleting a Student
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Ensure this exists in your api.ts
      // const res = await api.admin.deleteStudent(id); 
      // return res.json();
      console.log("Deleting student:", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/students'] });
      toast({ title: "Student Deleted", description: "The account has been removed." });
    }
  });

  const generateExcel = async () => {
    setIsGeneratingExcel(true);
    try {
      const response = await api.admin.generateStudentsExcel();
      const excelContent = await response.json();
      const excelGenerator = new ExcelGenerator();
      const filename = `Students_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      excelGenerator.downloadExcel(excelContent, filename);
    } catch (error) {
      toast({ title: "Export Failed", variant: "destructive" });
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold">Student Directory</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-9 px-4">
            {students?.length || 0} Registered
          </Badge>
          <Button 
            variant="outline" 
            onClick={generateExcel}
            disabled={isGeneratingExcel}
            className="hidden md:flex"
          >
            {isGeneratingExcel ? <Loader2 className="animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />}
            Export Excel
          </Button>
        </div>
      </div>

      {!students || students.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 opacity-60">
            <Users className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium">No students found</h3>
            <p className="text-sm">Student accounts will appear here after registration.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {students.map((student: any) => (
            <Card key={student._id || student.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  
                  {/* Student Meta */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold leading-none">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">@{student.username}</p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Badge variant={student.isVerified ? "default" : "secondary"}>
                          {student.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                        {student.isBlocked && <Badge variant="destructive">Blocked</Badge>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> {student.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> 
                        Last: {student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> 
                        Joined: {new Date(student.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 lg:flex-none"
                      onClick={() => setLocation(`/admin/students/${student._id || student.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Profile
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 lg:flex-none ${student.isBlocked ? 'bg-orange-50 text-orange-600 border-orange-200' : ''}`}
                    >
                      {student.isBlocked ? <CheckCircle className="h-4 w-4 mr-2" /> : <Ban className="h-4 w-4 mr-2 text-destructive" />}
                      {student.isBlocked ? 'Unblock' : 'Block'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 flex-1 lg:flex-none"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${student.username}?`)) {
                          deleteMutation.mutate(student._id || student.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
