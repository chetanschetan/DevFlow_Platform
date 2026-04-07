import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, BookOpen, Users, BarChart3, ArrowRight } from 'lucide-react';

export default function Home() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Code,
      title: 'Code Execution',
      description: 'Real-time Java code compilation and execution with instant feedback.'
    },
    {
      icon: BookOpen,
      title: 'Assignment Management',
      description: 'Create and manage coding assignments with multiple test cases.'
    },
    {
      icon: Users,
      title: 'Student Progress',
      description: 'Track student progress and submission history with detailed analytics.'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Comprehensive analytics and reporting for both students and administrators.'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-background to-muted/50">
      {/* Hero Section */}
      <div className="py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Code className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to <span className="text-primary">DevFlow</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The ultimate platform for Java programming education. 
            Create assignments, execute code, and track student progress all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setLocation('/login')}
              className="text-lg px-8 py-3"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setLocation('/login')}
              className="text-lg px-8 py-3"
            >
              Login
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Start?</CardTitle>
              <CardDescription>
                Join CodeGrade today and transform your programming education experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setLocation('/login')}
                  className="flex-1"
                >
                  Login
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/login')}
                  className="flex-1"
                >
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 