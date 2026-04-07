import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// MongoDB Schema Definitions
export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  course: string;
  section: string;
  role: 'student' | 'admin';
  isVerified: boolean;
  registerDate: Date;
  lastLogin?: Date;
  activityLog: Array<{
    type: 'run' | 'submit' | 'editor' | 'login';
    timestamp: Date;
    details: Record<string, any>;
  }>;
}

export interface IOTP extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IQuestion extends Document {
  questionId: string;
  title: string;
  description: string;
  marks: number;
  topic: string;
  taxonomyLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze';
  questionType: 'coding' | 'mcq' | 'guess_output';
  // For coding questions
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    marks: number;
  }>;
  hideTestCases?: boolean;
  // For MCQ questions
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  // For guess output questions
  codeSnippet?: string;
  expectedOutput?: string;
  isVisible: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubmission extends Document {
  studentId: string;
  questionId: string;
  code?: string; // For coding questions
  selectedOption?: string; // For MCQ questions
  guessedOutput?: string; // For guess output questions
  runCount: number;
  results: Array<{
    timestamp: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

// New collection for code drafts to enable persistent code saving
export interface ICodeDraft extends Document {
  studentId: string;
  questionId: string;
  code: string;
  lastSaved: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schemas
const UserSchema = new Schema<IUser>({
  username: { type: String, required: true},
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  course: { type: String, required: true },
  section: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student', required: true },
  isVerified: { type: Boolean, default: false, required: true },
  registerDate: { type: Date, default: Date.now, required: true },
  lastLogin: { type: Date },
  activityLog: [{
    type: { type: String, enum: ['run', 'submit', 'editor', 'login'], required: true },
    timestamp: { type: Date, default: Date.now, required: true },
    details: { type: Schema.Types.Mixed, required: true }
  }]
});

const OTPSchema = new Schema<IOTP>({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, required: true }
});

const QuestionSchema = new Schema<IQuestion>({
  questionId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  marks: { type: Number, required: true },
  topic: { type: String, required: true },
  taxonomyLevel: { type: String, enum: ['Remember', 'Understand', 'Apply', 'Analyze'], required: true },
  questionType: { type: String, enum: ['coding', 'mcq', 'guess_output'], required: true },
  // For coding questions
  testCases: [{
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    marks: { type: Number, required: true, default: 2 }
  }],
  hideTestCases: { type: Boolean, default: false },
  // For MCQ questions
  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
  }],
  // For guess output questions
  codeSnippet: { type: String },
  expectedOutput: { type: String },
  isVisible: { type: Boolean, default: true, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date, default: Date.now, required: true }
});

const SubmissionSchema = new Schema<ISubmission>({
  studentId: { type: String, required: true },
  questionId: { type: String, required: true },
  code: { type: String }, // For coding questions
  selectedOption: { type: String }, // For MCQ questions
  guessedOutput: { type: String }, // For guess output questions
  runCount: { type: Number, default: 0, required: true },
  results: [{
    timestamp: { type: Date, default: Date.now, required: true },
    passed: { type: Number, required: true },
    failed: { type: Number, required: true },
    score: { type: Number, required: true },
    marksEarned: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    testCaseResults: [{
      input: { type: String, required: true },
      output: { type: String, required: true },
      expected: { type: String, required: true },
      pass: { type: Boolean, required: true },
      marks: { type: Number, required: true }
    }]
  }],
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date, default: Date.now, required: true }
});

const CodeDraftSchema = new Schema<ICodeDraft>({
  studentId: { type: String, required: true },
  questionId: { type: String, required: true },
  code: { type: String, required: true },
  lastSaved: { type: Date, default: Date.now, required: true },
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date, default: Date.now, required: true }
});

// Create indexes
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
OTPSchema.index({ email: 1, code: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
QuestionSchema.index({ questionId: 1 });
QuestionSchema.index({ isVisible: 1 });
QuestionSchema.index({ questionType: 1 });
SubmissionSchema.index({ studentId: 1 });
SubmissionSchema.index({ questionId: 1 });
SubmissionSchema.index({ studentId: 1, questionId: 1 }, { unique: true });
CodeDraftSchema.index({ studentId: 1, questionId: 1 }, { unique: true });

// Export models
export const User =  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const OTP = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);
export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
export const Submission = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
export const CodeDraft = mongoose.models.CodeDraft || mongoose.model<ICodeDraft>('CodeDraft', CodeDraftSchema);


// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  course: z.string().min(1),
  section: z.string().min(1),
  role: z.enum(['student', 'admin']).default('student'),
});

export const insertQuestionSchema = z.object({
  questionId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  marks: z.number().positive(),
  topic: z.string().min(1),
  taxonomyLevel: z.enum(['Remember', 'Understand', 'Apply', 'Analyze']),
  questionType: z.enum(['coding', 'mcq', 'guess_output']),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    marks: z.number().positive().default(2)
  })).optional(),
  hideTestCases: z.boolean().optional(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean()
  })).optional(),
  codeSnippet: z.string().optional(),
  expectedOutput: z.string().optional(),
  isVisible: z.boolean().default(true),
  createdBy: z.string().min(1),
});

export const insertSubmissionSchema = z.object({
  studentId: z.string().min(1),
  questionId: z.string().min(1),
  code: z.string().optional(),
  selectedOption: z.string().optional(),
  guessedOutput: z.string().optional(),
});

export const insertCodeDraftSchema = z.object({
  studentId: z.string().min(1),
  questionId: z.string().min(1),
  code: z.string().min(1),
});

export type User = IUser;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OTP = IOTP;
export type Question = IQuestion;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Submission = ISubmission;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type CodeDraft = ICodeDraft;
export type InsertCodeDraft = z.infer<typeof insertCodeDraftSchema>;