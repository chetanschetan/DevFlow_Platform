import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Users, BookOpen, BarChart3 } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-gradient-to-br from-background to-muted/50">
      <div className="py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-primary">DevFlow</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            DevFlow is a comprehensive platform designed to revolutionize Java programming education. 
            We provide tools for creating assignments, executing code, and tracking student progress.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-6 w-6 mr-2 text-primary" />
                For Educators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Create engaging Java programming assignments with multiple test cases. 
                Track student progress, view submissions, and analyze performance with comprehensive analytics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-6 w-6 mr-2 text-primary" />
                For Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Practice Java programming with real-time code execution and instant feedback. 
                Submit assignments, view results, and track your learning progress.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Code className="h-4 w-4 mr-2 text-primary" />
                  Real-time Code Execution
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Assignment Management
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Student Progress Tracking
                </div>
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                  Performance Analytics
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 