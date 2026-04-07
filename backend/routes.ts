import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

import { storage } from "./storage";
import { AuthService } from "./services/auth";
import { EmailService } from "./services/email";
import { LocalCompilerService } from "./services/local-compiler";
import { insertUserSchema, insertQuestionSchema, insertSubmissionSchema } from "./shared/schema";
import rateLimit from "express-rate-limit";

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, try again later' }
});

// Removed runCodeLimiter since we're using local compiler with unlimited runs

// Middleware to verify JWT token
const authenticateToken = (req: any, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = AuthService.verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
};

// Middleware to check admin role
const requireAdmin = (req: any, res: Response, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Function to clean nested code tags
function cleanNestedCodeTags(html: string): string {
  return html
    // Remove empty code tags
    .replace(/<code[^>]*>\s*<\/code>/g, '')
    // Remove nested code tags - keep only the inner one with styles
    .replace(/<code[^>]*><code[^>]*>/g, '<code>')
    .replace(/<\/code><\/code>/g, '</code>')
    // Clean up any remaining backticks
    .replace(/`/g, '');
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });



  app.post('/api/auth/verify-email', authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      const otp = await storage.getOTP(email, String(code));
      if (!otp) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify user
      await storage.updateUser(user.id, { isVerified: true });
      await storage.deleteOTP(email);

      res.json({ message: 'Email verified successfully' });
    } catch (error: any) {
      console.error('Verification error:', error);
      res.status(400).json({ error: error.message || 'Verification failed' });
    }
  });

  app.post('/api/auth/resend-otp', authLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ error: 'User already verified' });
      }

      const otp = AuthService.generateOTP();
      await storage.createOTP(email, otp);
      await EmailService.sendVerificationEmail(email, otp);

      res.json({ message: 'Verification code resent' });
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      res.status(400).json({ error: error.message || 'Failed to resend code' });
    }
  });

  app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
       console.log(username);
      const user = await storage.getUserByUsername(username);
      console.log(user);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.isVerified) {
        return res.status(401).json({ error: 'Please verify your email before logging in' });
      }
        //  const isValidPassword = true;
      const isValidPassword = await AuthService.comparePasswords(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login and log activity
      await storage.updateUserLastLogin(user.id);
      await storage.addUserActivity(user.id, { type: 'login', details: { timestamp: new Date() } });

      const token = AuthService.generateToken(user);
      
      res.json({ 
        token, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ error: error.message || 'Login failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user information' });
    }
  });

  // Admin routes
  app.post('/api/admin/question', authenticateToken, requireAdmin, async (req: any, res: Response) => {
    try {
      if (!req.user.id) {
        return res.status(400).json({ error: 'User ID not found in token' });
      }
      
      // Add createdBy to the request body before validation
      const questionDataWithCreatedBy = {
        ...req.body,
        createdBy: req.user.id,
      };
      
      console.log('Creating question with data:', {
        questionType: questionDataWithCreatedBy.questionType,
        hasOptions: !!questionDataWithCreatedBy.options,
        hasTestCases: !!questionDataWithCreatedBy.testCases,
        hasCodeSnippet: !!questionDataWithCreatedBy.codeSnippet
      });
      
      const questionData = insertQuestionSchema.parse(questionDataWithCreatedBy);
      
      const question = await storage.createQuestion(questionData);

      console.log('Question created successfully:', {
        id: question._id,
        questionType: question.questionType
      });

      res.status(201).json(question);
    } catch (error: any) {
      console.error('Create question error:', error);
      res.status(400).json({ error: error.message || 'Failed to create question' });
    }
  });

  app.get('/api/admin/questions', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error: any) {
      console.error('Get questions error:', error);
      res.status(500).json({ error: 'Failed to get questions' });
    }
  });

  app.put('/api/admin/question/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = insertQuestionSchema.partial().parse(req.body);
      
      const question = await storage.updateQuestion(id, updates);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      res.json(question);
    } catch (error: any) {
      console.error('Update question error:', error);
      res.status(400).json({ error: error.message || 'Failed to update question' });
    }
  });

  app.delete('/api/admin/question/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteQuestion(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Question not found' });
      }

      res.json({ message: 'Question deleted successfully' });
    } catch (error: any) {
      console.error('Delete question error:', error);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  });

  app.get('/api/admin/submissions/:questionId', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { questionId } = req.params;
      const submissions = await storage.getSubmissionsByQuestion(questionId);
      res.json(submissions);
    } catch (error: any) {
      console.error('Get submissions error:', error);
      res.status(500).json({ error: 'Failed to get submissions' });
    }
  });

  app.get('/api/admin/dashboard/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const totalStudents = await storage.getTotalStudents();
      const totalQuestions = await storage.getTotalQuestions();
      const totalSubmissions = await storage.getTotalSubmissions();
      const passRate = await storage.getPassRate();
      
      res.json({
        totalStudents,
        totalQuestions,
        totalSubmissions,
        passRate
      });
    } catch (error: any) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
  });

  app.get('/api/admin/students', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error: any) {
      console.error('Get students error:', error);
      res.status(500).json({ error: 'Failed to get students' });
    }
  });

  app.get('/api/admin/student/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const student = await storage.getUser(id);
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      res.json(student);
    } catch (error: any) {
      console.error('Get student error:', error);
      res.status(500).json({ error: 'Failed to get student' });
    }
  });

  app.get('/api/admin/student-submissions/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const submissions = await storage.getSubmissionsByStudent(id);
      res.json(submissions);
    } catch (error: any) {
      console.error('Get student submissions error:', error);
      res.status(500).json({ error: 'Failed to get student submissions' });
    }
  });

  app.get('/api/admin/questions', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error: any) {
      console.error('Get questions error:', error);
      res.status(500).json({ error: 'Failed to get questions' });
    }
  });

  app.post('/api/admin/student-pdf/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const student = await storage.getUser(id);
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const submissions = await storage.getSubmissionsByStudent(id);
      const questions = await storage.getQuestions();

      // Create PDF content
      const pdfContent = {
        student,
        submissions,
        questions,
        generatedAt: new Date().toISOString()
      };

      // For now, return the data as JSON - PDF generation will be handled client-side
      res.json(pdfContent);
    } catch (error: any) {
      console.error('Generate student PDF error:', error);
      res.status(500).json({ error: 'Failed to generate student PDF' });
    }
  });

  app.post('/api/admin/students-excel', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const students = await storage.getAllStudents();
      const questions = await storage.getQuestions();
      
      // Get submissions for all students
      const allStudentData = await Promise.all(
        students.map(async (student: any) => {
          const submissions = await storage.getSubmissionsByStudent(student._id);
          
          // Calculate metrics for this student
          const totalSubmissions = submissions.length;
          const totalQuestions = questions.length;
          const completedQuestions = submissions.filter(s => 
            s.results.some((r:any) => r.failed === 0)
          ).length;
          
          const totalMarksEarned = submissions.reduce((acc:number, s:any) => {
            const latestResult = s.results[s.results.length - 1];
            return acc + (latestResult?.marksEarned || 0);
          }, 0);
          
          const totalPossibleMarks = submissions.reduce((acc:number, s:any) => {
            const latestResult = s.results[s.results.length - 1];
            return acc + (latestResult?.totalMarks || 0);
          }, 0);
          
          const averageScore = totalSubmissions > 0 
            ? submissions.reduce((acc:number, s:any) => {
                const latestResult = s.results[s.results.length - 1];
                return acc + (latestResult?.score || 0);
              }, 0) / totalSubmissions
            : 0;
          
          const totalCodeRuns = submissions.reduce((acc: number, s: any) => acc + s.runCount, 0);
          const failedAttempts = submissions.filter(s => 
            s.results.some((r:any) => r.failed > 0)
          ).length;
          
          const successRate = totalSubmissions > 0 
            ? Math.round((completedQuestions / totalSubmissions) * 100)
            : 0;
          
          return {
            studentId: student._id.toString(),
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            username: student.username,
            isVerified: student.isVerified,
            registrationDate: student.registerDate,
            lastLogin: student.lastLogin,
            totalSubmissions,
            totalQuestions,
            completedQuestions,
            totalMarksEarned,
            totalPossibleMarks,
            averageScore: Math.round(averageScore),
            totalCodeRuns,
            failedAttempts,
            successRate,
            completionRate: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0
          };
        })
      );

      // Return the data for client-side Excel generation
      res.json({
        students: allStudentData,
        questions: questions.length,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Generate students Excel error:', error);
      res.status(500).json({ error: 'Failed to generate students Excel' });
    }
  });

  app.get('/api/admin/all-submissions', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const submissions = await storage.getAllSubmissions();
      const students = await storage.getAllStudents();
      const questions = await storage.getQuestions();
      
      // Enrich submissions with student and question data
      const enrichedSubmissions = submissions.map((submission: any) => {
        const student = students.find((s: any) => s._id.toString() === submission.studentId);
        const question = questions.find((q: any) => q._id.toString() === submission.questionId);
        const latestResult = submission.results[submission.results.length - 1];
        
        return {
          ...submission.toObject(),
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
          studentEmail: student?.email || 'Unknown',
          studentUsername: student?.username || 'Unknown',
          questionTitle: question?.title || 'Unknown Question',
          questionId: question?.questionId || 'Unknown',
          questionTopic: question?.topic || 'Unknown',
          latestResult,
          isCompleted: latestResult?.failed === 0,
          score: latestResult?.score || 0,
          marksEarned: latestResult?.marksEarned || 0,
          totalMarks: latestResult?.totalMarks || 0
        };
      });
      
      res.json(enrichedSubmissions);
    } catch (error: any) {
      console.error('Get all submissions error:', error);
      res.status(500).json({ error: 'Failed to get all submissions' });
    }
  });

  app.get('/api/admin/question/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const question = await storage.getQuestion(id);
      
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Clean up description - remove nested code tags and backticks
      if (question.description) {
        question.description = cleanNestedCodeTags(question.description);
      }

      res.json(question);
    } catch (error: any) {
      console.error('Get question error:', error);
      res.status(500).json({ error: 'Failed to get question' });
    }
  });

  // Student routes
  app.get('/api/student/assignments', authenticateToken, async (req: Request, res: Response) => {
    try {
      const questions = await storage.getVisibleQuestions();
      
      // Clean up descriptions - remove nested code tags and backticks
      questions.forEach(question => {
        if (question.description) {
          question.description = cleanNestedCodeTags(question.description);
        }
      });
      
      res.json(questions);
    } catch (error: any) {
      console.error('Get assignments error:', error);
      res.status(500).json({ error: 'Failed to get assignments' });
    }
  });

  app.get('/api/student/assignment/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const question = await storage.getQuestion(id);
      
      if (!question || !question.isVisible) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      // Log the question data for debugging
      console.log('Question data from database:', {
        id: question._id,
        questionId: question.questionId,
        title: question.title,
        questionType: question.questionType,
        hasOptions: !!question.options,
        hasTestCases: !!question.testCases,
        hasCodeSnippet: !!question.codeSnippet
      });

      // Clean up description - remove nested code tags and backticks
      if (question.description) {
        question.description = cleanNestedCodeTags(question.description);
      }

      res.json(question);
    } catch (error: any) {
      console.error('Get assignment error:', error);
      res.status(500).json({ error: 'Failed to get assignment' });
    }
  });

  app.post('/api/student/run', authenticateToken, async (req: any, res: Response) => {
    try {
      const { code, questionId, input = '' } = req.body;
      
      console.log('Run code request:', { questionId, codeLength: code.length, input });

      // Log activity
      await storage.addUserActivity(req.user.id, { 
        type: 'run', 
        details: { questionId, codeLength: code.length } 
      });

      // Get the question to access test cases
      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      console.log('Question found:', { 
        id: question.id, 
        questionType: question.questionType, 
        testCasesCount: question.testCases?.length || 0 
      });

      // For coding questions, run test cases instead of single execution
      let result = null;
      let testResults = null;
      
      if (question.questionType === 'coding' && question.testCases && question.testCases.length > 0) {
        console.log('Running test cases for coding question...');
        
        // Detect if this is a Scanner-based question by checking the description
        const isScannerQuestion = question.description && (
          question.description.toLowerCase().includes('scanner') ||
          question.description.toLowerCase().includes('input from user') ||
          question.description.toLowerCase().includes('using scanner') ||
          question.description.toLowerCase().includes('takes input') ||
          question.description.toLowerCase().includes('read input')
        );
        
        console.log('Question type detection:', { 
          description: question.description?.substring(0, 100) + '...',
          isScannerQuestion 
        });
        
        // For Scanner-based questions, use stdin (useStdin: true)
        // For command-line argument questions, use command-line args (useStdin: false)
        const useStdin: boolean = Boolean(isScannerQuestion);
        
        testResults = await LocalCompilerService.runTestCases(code, question.testCases, req.user.id, useStdin);
        console.log('Test results:', testResults);
        
        // Create a result object from the first test case for compatibility
        const firstTestCase = question.testCases[0];
        result = await LocalCompilerService.executeJavaCode(code, firstTestCase.input, req.user.id, useStdin);
      } else {
        // For non-coding questions or questions without test cases, run with the provided input
        // For non-coding questions, default to stdin input (for Scanner-based questions)
        // For coding questions without test cases, also use stdin
        const useStdin = question.questionType !== 'coding' || !question.testCases || question.testCases.length === 0;
        result = await LocalCompilerService.executeJavaCode(code, input, req.user.id, useStdin);
        
        // For questions without test cases, create a basic test result
        if (question.questionType === 'coding' && (!question.testCases || question.testCases.length === 0)) {
          testResults = {
            passed: 0,
            failed: 0,
            score: 0,
            marksEarned: 0,
            totalMarks: question.marks || 0,
            testCaseResults: []
          };
        }
      }

      // Ensure a submission exists and increment run count; keep latest code
      let submission = await storage.getSubmissionByStudentAndQuestion(req.user.id, questionId);
      if (!submission) {
        submission = await storage.createSubmission({
          studentId: req.user.id,
          questionId,
          code,
        });
      } else {
        await storage.updateSubmission(submission.id, { code });
      }
      await storage.incrementRunCount(submission.id);

      // Return both execution result and test results
      if (testResults) {
        // Flatten the test results for frontend compatibility
        res.json({
          ...result,
          ...testResults, // Flatten passed, failed, score, testCaseResults
          testResults // Keep the original structure for backward compatibility
        });
      } else {
        res.json({
          ...result,
          testResults
        });
      }
    } catch (error: any) {
      console.error('Code run error:', error);
      res.status(500).json({ error: error.message || 'Code execution failed' });
    }
  });

  app.post('/api/student/submit', authenticateToken, async (req: any, res: Response) => {
    try {
      const { code, questionId, selectedOption, guessedOutput } = req.body;

      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Backward compatibility: default undefined type to 'coding'
      const questionType = (question as any).questionType || 'coding';

      // Handle different question types
      if (questionType === 'coding') {
        if (!code) {
          return res.status(400).json({ error: 'Code is required for coding questions' });
        }

        // Get or create submission (do not depend on prior results)
        let submission = await storage.getSubmissionByStudentAndQuestion(req.user.id, questionId);
        if (!submission) {
          submission = await storage.createSubmission({
            studentId: req.user.id,
            questionId,
            code,
          });
        } else {
          await storage.updateSubmission(submission.id, { code });
        }

        // Require at least one run
        if (!submission.runCount || submission.runCount <= 0) {
          return res.status(400).json({ 
            error: 'You must run your code at least once before submitting',
            requiresRun: true 
          });
        }

        // Run test cases now and gate on their outcome
        // Use the same Scanner detection logic as the run endpoint
        const isScannerQuestion = question.description && (
          question.description.toLowerCase().includes('scanner') ||
          question.description.toLowerCase().includes('input from user') ||
          question.description.toLowerCase().includes('using scanner') ||
          question.description.toLowerCase().includes('takes input') ||
          question.description.toLowerCase().includes('read input')
        );
        
        const useStdin: boolean = Boolean(isScannerQuestion);
        const testResults = await LocalCompilerService.runTestCases(code, question.testCases || [], req.user.id, useStdin);
        
        // Handle case where there are no test cases
        if (!question.testCases || question.testCases.length === 0) {
          // For questions without test cases, create a basic result
          const basicResult = {
            timestamp: new Date(),
            passed: 1, // Assume passed if no test cases
            failed: 0,
            score: 100, // Full marks if no test cases
            marksEarned: question.marks || 0,
            totalMarks: question.marks || 0,
            testCaseResults: []
          };
          
          await storage.addSubmissionResult(submission.id, basicResult);
          
          // Log activity
          await storage.addUserActivity(req.user.id, { 
            type: 'submit', 
            details: { questionId, score: 100, passed: 1, failed: 0 } 
          });

          res.json({
            message: 'Code submitted successfully (no test cases)',
            ...basicResult,
          });
          return;
        }
        
        if (testResults.failed > 0) {
          return res.status(400).json({
            error: 'All test cases must pass before submitting. Please run your code and fix any errors.',
            requiresAllTestsPass: true,
            ...testResults,
          });
        }

        // Record the passing result with marks
        await storage.addSubmissionResult(submission.id, {
          timestamp: new Date(),
          passed: testResults.passed,
          failed: testResults.failed,
          score: testResults.score,
          marksEarned: testResults.marksEarned,
          totalMarks: testResults.totalMarks,
          testCaseResults: testResults.testCaseResults
        });

        // Keep draft (so students can revisit latest code)

        // Log activity
        await storage.addUserActivity(req.user.id, { 
          type: 'submit', 
          details: { questionId, score: testResults.score, passed: testResults.passed, failed: testResults.failed } 
        });

        res.json({
          message: 'Code submitted successfully',
          ...testResults,
        });
      } else if (questionType === 'mcq') {
        if (!selectedOption) {
          return res.status(400).json({ error: 'Please select an option' });
        }

        const selectedOptionData = question.options?.find(opt => String(opt.id) === String(selectedOption));
        if (!selectedOptionData) {
          return res.status(400).json({ error: 'Invalid option selected' });
        }
        const isCorrect = selectedOptionData.isCorrect;
        const score = isCorrect ? question.marks : 0;

        let submission = await storage.getSubmissionByStudentAndQuestion(req.user.id, questionId);
        if (!submission) {
          submission = await storage.createSubmission({
            studentId: req.user.id,
            questionId,
            selectedOption,
          } as any);
        } else {
          await storage.updateSubmission(submission.id, { selectedOption } as any);
        }

        await storage.addSubmissionResult(submission.id, {
          timestamp: new Date(),
          passed: isCorrect ? 1 : 0,
          failed: isCorrect ? 0 : 1,
          score,
        });

        res.json({ message: 'MCQ submitted successfully', passed: isCorrect ? 1 : 0, failed: isCorrect ? 0 : 1, score, isCorrect });
      } else if (questionType === 'guess_output') {
        if (!guessedOutput?.trim()) {
          return res.status(400).json({ error: 'Please provide your output guess' });
        }

        const isCorrect = guessedOutput.trim() === (question.expectedOutput || '').trim();
        const score = isCorrect ? question.marks : 0;

        let submission = await storage.getSubmissionByStudentAndQuestion(req.user.id, questionId);
        if (!submission) {
          submission = await storage.createSubmission({
            studentId: req.user.id,
            questionId,
            guessedOutput,
          } as any);
        } else {
          await storage.updateSubmission(submission.id, { guessedOutput } as any);
        }

        await storage.addSubmissionResult(submission.id, {
          timestamp: new Date(),
          passed: isCorrect ? 1 : 0,
          failed: isCorrect ? 0 : 1,
          score,
        });

        res.json({ message: 'Output guess submitted successfully', passed: isCorrect ? 1 : 0, failed: isCorrect ? 0 : 1, score, isCorrect });
      } else {
        return res.status(400).json({ error: 'Invalid question type' });
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      res.status(500).json({ error: error.message || 'Submission failed' });
    }
  });

  // New endpoint for code drafts
  app.post('/api/student/save-draft', authenticateToken, async (req: any, res: Response) => {
    try {
      const { code, questionId } = req.body;

      const question = await storage.getQuestion(questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Default to 'coding' if questionType is not set (backward compatibility)
      const questionType = question.questionType || 'coding';
      if (questionType !== 'coding') {
        return res.status(400).json({ error: 'Draft saving is only available for coding questions' });
      }

      await storage.saveCodeDraft({
        studentId: req.user.id,
        questionId,
        code,
      });

      res.json({ message: 'Code draft saved successfully' });
    } catch (error: any) {
      console.error('Save draft error:', error);
      res.status(500).json({ error: error.message || 'Failed to save draft' });
    }
  });

  app.get('/api/student/draft/:questionId', authenticateToken, async (req: any, res: Response) => {
    try {
      const { questionId } = req.params;
      const draft = await storage.getCodeDraft(req.user.id, questionId);
      res.json(draft || null);
    } catch (error: any) {
      console.error('Get draft error:', error);
      res.status(500).json({ error: 'Failed to get draft' });
    }
  });

  app.post('/api/student/auto-save', authenticateToken, async (req: any, res: Response) => {
    try {
      const { code, questionId } = req.body;
      
      console.log('Auto-save request:', { questionId, codeLength: code?.length });

      const question = await storage.getQuestion(questionId);
      console.log('Question found:', { 
        found: !!question, 
        questionId: question?._id, 
        questionType: question?.questionType 
      });
      
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Default to 'coding' if questionType is not set (backward compatibility)
      const questionType = question.questionType || 'coding';
      console.log('Question type check:', { questionType, isCoding: questionType === 'coding' });
      
      if (questionType !== 'coding') {
        return res.status(400).json({ error: 'Auto-save is only available for coding questions' });
      }

      // Save to code draft instead of submission
      await storage.saveCodeDraft({
        studentId: req.user.id,
        questionId,
        code,
      });

      console.log('Auto-save successful for question:', questionId);
      res.json({ message: 'Code auto-saved successfully' });
    } catch (error: any) {
      console.error('Auto-save error:', error);
      res.status(500).json({ error: error.message || 'Auto-save failed' });
    }
  });

  app.get('/api/student/submissions/:questionId', authenticateToken, async (req: any, res: Response) => {
    try {
      const { questionId } = req.params;
      const submission = await storage.getSubmissionByStudentAndQuestion(req.user.id, questionId);
      res.json(submission || null);
    } catch (error: any) {
      console.error('Get submission error:', error);
      res.status(500).json({ error: 'Failed to get submission' });
    }
  });

  app.get('/api/student/my-submissions', authenticateToken, async (req: any, res: Response) => {
    try {
      const submissions = await storage.getSubmissionsByStudent(req.user.id);
      res.json(submissions);
    } catch (error: any) {
      console.error('Get submissions error:', error);
      res.status(500).json({ error: 'Failed to get submissions' });
    }
  });

  app.get('/api/student/editor-state/:questionId', authenticateToken, async (req: any, res: Response) => {
    try {
      const { questionId } = req.params;
      const state = await storage.getLatestEditorState(req.user.id, questionId);
      res.json(state || null);
    } catch (error: any) {
      console.error('Get editor state error:', error);
      res.status(500).json({ error: 'Failed to get editor state' });
    }
  });

  // User profile routes
  app.put('/api/user/profile', authenticateToken, async (req: any, res: Response) => {
    try {
      const { firstName, lastName, course, section } = req.body;
      
      await storage.updateUser(req.user.id, {
        firstName,
        lastName,
        course,
        section,
      });

      res.json({ message: 'Profile updated successfully' });
    } catch (error: any) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  });

  app.post('/api/user/password-reset-otp', authenticateToken, async (req: any, res: Response) => {
    try {
      const user = await storage.getUserByUsername(req.user.username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const otp = AuthService.generateOTP();
      await storage.createOTP(user.email, otp);
      await EmailService.sendVerificationEmail(user.email, otp);

      res.json({ message: 'Password reset OTP sent successfully' });
    } catch (error: any) {
      console.error('Password reset OTP error:', error);
      res.status(500).json({ error: error.message || 'Failed to send OTP' });
    }
  });

  app.post('/api/user/change-password', authenticateToken, async (req: any, res: Response) => {
    try {
      const { currentPassword, newPassword, otp } = req.body;

      const user = await storage.getUserByUsername(req.user.username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isCurrentPasswordValid = await AuthService.comparePasswords(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Verify OTP
      const otpRecord = await storage.getOTP(user.email, otp);
      if (!otpRecord) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      // Hash new password
      const newPasswordHash = await AuthService.hashPassword(newPassword);
      
      // Update password
      await storage.updateUser(user.id, { passwordHash: newPasswordHash });
      
      // Delete OTP
      await storage.deleteOTP(user.email);

      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ error: error.message || 'Failed to change password' });
    }
  });

    // --- ADMIN ANALYTICS ENDPOINT ---
  app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { range } = req.query;
      const days = range === '7d' ? 7 : range === '1y' ? 365 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Single-pass aggregation using $facet for high performance
      const analytics = await storage.getAnalyticsData(startDate);

      // Get real-time student counts
      const totalStudents = await storage.getTotalStudents();
      const activeStudentsCount = await storage.getActiveStudentsCount(startDate);

      // Destructure aggregated results with fallbacks
      const { 
        overview = [{}], 
        submissionTrends = [], 
        topicPerformance = [], 
        questionStats = [] 
      } = analytics[0] || {};

      const stats = overview[0] || {};

      res.json({
        overview: {
          totalStudents,
          activeStudents: activeStudentsCount,
          totalSubmissions: stats.totalSubmissions || 0,
          averageScore: Math.round(stats.averageScore || 0),
          trends: { 
            students: 0, // You can calculate these by comparing to previous period if needed
            submissions: 0, 
            score: 0 
          }
        },
        submissionTrends,
        topicPerformance,
        questionStats,
        // Calculate score distribution for the Pie Chart
        scoreDistribution: [
          { range: '90-100%', count: stats.highScores || 0 },
          { range: '70-89%', count: stats.midScores || 0 },
          { range: '0-69%', count: stats.lowScores || 0 },
        ]
      });
    } catch (error: any) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

//endpoint genrate new client 
//by defalut call passing new arguments 
//admin
