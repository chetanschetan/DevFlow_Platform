// --- 1. IMPORT PATH CORRECTION ---
// We use relative paths now that the folder structure is decoupled
import { 
  type User, type InsertUser, type OTP, type Question, type InsertQuestion, 
  type Submission, type InsertSubmission, type CodeDraft, type InsertCodeDraft, 
  User as UserModel, OTP as OTPModel, Question as QuestionModel, 
  Submission as SubmissionModel, CodeDraft as CodeDraftModel 
} from "./shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, 'password'> & { passwordHash: string; isVerified?: boolean }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserLastLogin(id: string): Promise<void>;
  addUserActivity(id: string, activity: { type: string; details: any }): Promise<void>;
  
  // OTP methods
  createOTP(email: string, code: string): Promise<OTP>;
  getOTP(email: string, code: string): Promise<OTP | undefined>;
  deleteOTP(email: string): Promise<void>;

  // Question methods
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestions(): Promise<Question[]>;
  getVisibleQuestions(): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;

  // Submission methods
  getSubmission(id: string): Promise<Submission | undefined>;
  getAllSubmissions(): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  getSubmissionsByQuestion(questionId: string): Promise<Submission[]>;
  getSubmissionByStudentAndQuestion(studentId: string, questionId: string): Promise<Submission | undefined>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined>;
  addSubmissionResult(id: string, result: any): Promise<void>;
  incrementRunCount(id: string): Promise<void>;

  // Code Draft methods
  getCodeDraft(studentId: string, questionId: string): Promise<CodeDraft | undefined>;
  saveCodeDraft(draft: InsertCodeDraft): Promise<CodeDraft>;
  updateCodeDraft(studentId: string, questionId: string, code: string): Promise<CodeDraft | undefined>;
  deleteCodeDraft(studentId: string, questionId: string): Promise<boolean>;

  // Editor State
  getLatestEditorState(studentId: string, questionId: string): Promise<{ source: 'draft' | 'submission'; code: string; updatedAt: Date } | undefined>;

  // Admin dashboard methods
  getTotalStudents(): Promise<number>;
  getTotalQuestions(): Promise<number>;
  getTotalSubmissions(): Promise<number>;
  getPassRate(): Promise<number>;
  getAllStudents(): Promise<User[]>;

  // Analytics
  getAnalyticsData(startDate: Date): Promise<any>;
  getActiveStudentsCount(startDate: Date): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(id);
      return (user as User) || undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username });
      return (user as User) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email });
      return (user as User) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async createUser(insertUser: Omit<InsertUser, 'password'> & { passwordHash: string; isVerified?: boolean }): Promise<User> {
    const user = new UserModel(insertUser);
    return await user.save();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const user = await UserModel.findByIdAndUpdate(id, updates, { new: true });
      return (user as User) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async updateUserLastLogin(id: string): Promise<void> {
    try {
      // FIX: Ensure ID is treated as a string or ObjectId properly
      if (!id) return;
      await UserModel.findByIdAndUpdate(id, { lastLogin: new Date() });
    } catch (error) {
      console.error('Error updating user last login:', error);
    }
  }

  async addUserActivity(id: string, activity: { type: string; details: any }): Promise<void> {
    try {
      if (!id) return;
      const newActivity = {
        // FIX: Ensure type is cast correctly to match the schema enum
        type: activity.type as any, 
        timestamp: new Date(),
        details: activity.details
      };
      await UserModel.findByIdAndUpdate(id, {
        $push: { activityLog: newActivity }
      });
    } catch (error) {
      // This was likely throwing the "string error" if ID was malformed
      console.error('Error adding user activity:', error);
    }
  }

  // OTP methods
  async createOTP(email: string, code: string): Promise<OTP> {
    await OTPModel.deleteMany({ email });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const otp = new OTPModel({ email, code, expiresAt });
    return await otp.save();
  }

  async getOTP(email: string, code: string): Promise<OTP | undefined> {
    try {
      const otp = await OTPModel.findOne({ 
        email, 
        code, 
        expiresAt: { $gt: new Date() } 
      });
      return (otp as OTP) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async deleteOTP(email: string): Promise<void> {
    try {
      await OTPModel.deleteMany({ email });
    } catch (error) {
      console.error('Error deleting OTP:', error);
    }
  }

  // Question methods
  async getQuestion(id: string): Promise<Question | undefined> {
    try {
      const question = await QuestionModel.findById(id);
      return (question as Question) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getQuestions(): Promise<Question[]> {
    try {
      return await QuestionModel.find().sort({ createdAt: -1 });
    } catch (error) {
      return [];
    }
  }

  async getVisibleQuestions(): Promise<Question[]> {
    try {
      return await QuestionModel.find({ isVisible: true }).sort({ createdAt: -1 });
    } catch (error) {
      return [];
    }
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const question = new QuestionModel(insertQuestion);
    return await question.save();
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined> {
    try {
      const question = await QuestionModel.findByIdAndUpdate(
        id, 
        { ...updates, updatedAt: new Date() }, 
        { new: true }
      );
      return (question as Question) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const result = await QuestionModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      return false;
    }
  }

  // Submission methods
  async getSubmission(id: string): Promise<Submission | undefined> {
    try {
      const submission = await SubmissionModel.findById(id);
      return (submission as Submission) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async getAllSubmissions(): Promise<Submission[]> {
    try {
      return await SubmissionModel.find().sort({ createdAt: -1 });
    } catch (error) {
      return [];
    }
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    try {
      return await SubmissionModel.find({ studentId }).sort({ createdAt: -1 });
    } catch (error) {
      return [];
    }
  }

  async getSubmissionsByQuestion(questionId: string): Promise<Submission[]> {
    try {
      return await SubmissionModel.find({ questionId }).sort({ createdAt: -1 });
    } catch (error) {
      return [];
    }
  }

  async getSubmissionByStudentAndQuestion(studentId: string, questionId: string): Promise<Submission | undefined> {
    try {
      const submission = await SubmissionModel.findOne({ studentId, questionId });
      return (submission as Submission) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const submission = new SubmissionModel(insertSubmission);
    return await submission.save();
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<Submission | undefined> {
    try {
      const submission = await SubmissionModel.findByIdAndUpdate(
        id, 
        { ...updates, updatedAt: new Date() }, 
        { new: true }
      );
      return (submission as Submission) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async addSubmissionResult(id: string, result: any): Promise<void> {
    try {
      await SubmissionModel.findByIdAndUpdate(id, {
        $push: { results: result },
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding submission result:', error);
    }
  }

  async incrementRunCount(id: string): Promise<void> {
    try {
      await SubmissionModel.findByIdAndUpdate(id, {
        $inc: { runCount: 1 },
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error incrementing run count:', error);
    }
  }

  // Code Draft methods
  async getCodeDraft(studentId: string, questionId: string): Promise<CodeDraft | undefined> {
    try {
      const drafts = await CodeDraftModel.find({ studentId, questionId }).sort({ updatedAt: -1 });
      const latest = drafts[0];
      if (drafts.length > 1) {
        const idsToKeep = latest ? [latest._id] : [];
        await CodeDraftModel.deleteMany({ studentId, questionId, _id: { $nin: idsToKeep } });
      }
      return (latest as CodeDraft) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async saveCodeDraft(draft: InsertCodeDraft): Promise<CodeDraft> {
    const now = new Date();
    const upserted = await CodeDraftModel.findOneAndUpdate(
      { studentId: draft.studentId, questionId: draft.questionId },
      { $set: { code: draft.code, updatedAt: now, lastSaved: now }, $setOnInsert: { createdAt: now } },
      { new: true, upsert: true }
    );
    return (upserted as CodeDraft);
  }

  async updateCodeDraft(studentId: string, questionId: string, code: string): Promise<CodeDraft | undefined> {
    try {
      const draft = await CodeDraftModel.findOneAndUpdate(
        { studentId, questionId },
        { code, updatedAt: new Date() },
        { new: true }
      );
      return (draft as CodeDraft) || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async deleteCodeDraft(studentId: string, questionId: string): Promise<boolean> {
    try {
      const result = await CodeDraftModel.findOneAndDelete({ studentId, questionId });
      return !!result;
    } catch (error) {
      return false;
    }
  }

  // State Reconciliation logic for the Editor
  async getLatestEditorState(studentId: string, questionId: string): Promise<{ source: 'draft' | 'submission'; code: string; updatedAt: Date } | undefined> {
    try {
      const [draft, submission] = await Promise.all([
        CodeDraftModel.findOne({ studentId, questionId }),
        SubmissionModel.findOne({ studentId, questionId })
      ]);

      const draftTime = draft?.updatedAt ? new Date(draft.updatedAt).getTime() : 0;
      const subTime = submission?.updatedAt ? new Date(submission.updatedAt).getTime() : 0;

      if (draft && (!submission || draftTime >= subTime)) {
        return { source: 'draft', code: draft.code, updatedAt: draft.updatedAt as Date };
      }
      if (submission && submission.code) {
        return { source: 'submission', code: submission.code, updatedAt: submission.updatedAt as Date };
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  // Admin dashboard methods
  async getTotalStudents(): Promise<number> {
    try {
      return await UserModel.countDocuments({ role: 'student' });
    } catch (error) {
      return 0;
    }
  }

  async getTotalQuestions(): Promise<number> {
    try {
      return await QuestionModel.countDocuments();
    } catch (error) {
      return 0;
    }
  }

  async getTotalSubmissions(): Promise<number> {
    try {
      return await SubmissionModel.countDocuments();
    } catch (error) {
      return 0;
    }
  }

  async getPassRate(): Promise<number> {
    try {
      const submissions = await SubmissionModel.find();
      if (submissions.length === 0) return 0;
      let totalPassed = 0;
      let totalResults = 0;
      for (const submission of submissions) {
        if (submission.results && submission.results.length > 0) {
          totalResults++;
          const latestResult = submission.results[submission.results.length - 1];
          if (latestResult.score >= 70) totalPassed++;
        }
      }
      return totalResults > 0 ? Math.round((totalPassed / totalResults) * 100) : 0;
    } catch (error) {
      return 0;
    }
  }

  async getAllStudents(): Promise<User[]> {
    try {
      return await UserModel.find({ role: 'student' }).select('-passwordHash');
    } catch (error) {
      return [];
    }
  }
  // --- ANALYTICS AGGREGATION ENGINE ---
  async getAnalyticsData(startDate: Date): Promise<any> {
    try {
      const results = await SubmissionModel.aggregate([
        {
          $facet: {
            // 1. Overview metrics
            overview: [
              {
                $group: {
                  _id: null,
                  totalSubmissions: { $sum: 1 },
                  averageScore: { $avg: "$score" },
                  highScores: { $sum: { $cond: [{ $gte: ["$score", 90] }, 1, 0] } },
                  midScores: { $sum: { $cond: [{ $and: [{ $gte: ["$score", 70] }, { $lt: ["$score", 90] }] }, 1, 0] } },
                  lowScores: { $sum: { $cond: [{ $lt: ["$score", 70] }, 1, 0] } }
                }
              }
            ],
            // 2. Line Chart: Submissions & Passes over time
            submissionTrends: [
              { $match: { createdAt: { $gte: startDate } } },
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                  submissions: { $sum: 1 },
                  passed: { $sum: { $cond: ["$passed", 1, 0] } }
                }
              },
              { $sort: { "_id": 1 } },
              { $project: { date: "$_id", submissions: 1, passed: 1, _id: 0 } }
            ],
            // 3. Bar Chart: Performance by Topic (Joins with Questions)
            topicPerformance: [
              {
                $lookup: {
                  from: "questions", // Ensure this matches your MongoDB collection name
                  localField: "questionId",
                  foreignField: "_id",
                  as: "q"
                }
              },
              { $unwind: "$q" },
              {
                $group: {
                  _id: "$q.topic",
                  avgScore: { $avg: "$score" }
                }
              },
              { $project: { topic: "$_id", avgScore: { $round: ["$avgScore", 1] }, _id: 0 } }
            ],
            // 4. Table: Question-wise stats
            questionStats: [
              {
                $group: {
                  _id: "$questionId",
                  totalAttempts: { $sum: 1 },
                  passedCount: { $sum: { $cond: ["$passed", 1, 0] } },
                  averageScore: { $avg: "$score" }
                }
              },
              {
                $lookup: {
                  from: "questions",
                  localField: "_id",
                  foreignField: "_id",
                  as: "details"
                }
              },
              { $unwind: "$details" },
              {
                $project: {
                  id: "$_id",
                  title: "$details.title",
                  totalAttempts: 1,
                  successRate: { $round: [{ $multiply: [{ $divide: ["$passedCount", "$totalAttempts"] }, 100] }, 1] },
                  averageScore: { $round: ["$averageScore", 1] }
                }
              }
            ]
          }
        }
      ]);
      return results;
    } catch (error) {
      console.error('Aggregation Error:', error);
      return [{}];
    }
  }

  async getActiveStudentsCount(startDate: Date): Promise<number> {
    try {
      const activeIds = await SubmissionModel.distinct("studentId", {
        createdAt: { $gte: startDate }
      });
      return activeIds.length;
    } catch (error) {
      return 0;
    }
  }
}

export const storage = new DatabaseStorage();