import * as XLSX from 'xlsx';

interface StudentData {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  isVerified: boolean;
  registrationDate: string;
  lastLogin?: string;
  totalSubmissions: number;
  totalQuestions: number;
  completedQuestions: number;
  totalMarksEarned: number;
  totalPossibleMarks: number;
  averageScore: number;
  totalCodeRuns: number;
  failedAttempts: number;
  successRate: number;
  completionRate: number;
}

interface ExcelContent {
  students: StudentData[];
  questions: number;
  generatedAt: string;
}

export class ExcelGenerator {
  public generateStudentsReport(content: ExcelContent): XLSX.WorkBook {
    const { students } = content;
    
    // Prepare data for Excel
    const excelData = students.map(student => ({
      'Student ID': student.studentId,
      'First Name': student.firstName,
      'Last Name': student.lastName,
      'Email': student.email,
      'Username': student.username,
      'Verified': student.isVerified ? 'Yes' : 'No',
      'Registration Date': student.registrationDate ? new Date(student.registrationDate).toLocaleDateString() : 'N/A',
      'Last Login': student.lastLogin ? new Date(student.lastLogin).toLocaleString() : 'Never',
      'Total Submissions': student.totalSubmissions,
      'Total Questions': student.totalQuestions,
      'Completed Questions': student.completedQuestions,
      'Completion Rate (%)': student.completionRate,
      'Total Marks Earned': student.totalMarksEarned,
      'Total Possible Marks': student.totalPossibleMarks,
      'Average Score (%)': student.averageScore,
      'Total Code Runs': student.totalCodeRuns,
      'Failed Attempts': student.failedAttempts,
      'Success Rate (%)': student.successRate,
      'Performance Grade': this.getPerformanceGrade(student.averageScore),
      'Status': this.getStudentStatus(student.completionRate, student.averageScore),
      'Completion': `${student.completedQuestions} / ${student.totalQuestions}`
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Student ID
      { wch: 12 }, // First Name
      { wch: 12 }, // Last Name
      { wch: 25 }, // Email
      { wch: 15 }, // Username
      { wch: 8 },  // Verified
      { wch: 15 }, // Registration Date
      { wch: 20 }, // Last Login
      { wch: 15 }, // Total Submissions
      { wch: 15 }, // Total Questions
      { wch: 18 }, // Completed Questions
      { wch: 18 }, // Completion Rate
      { wch: 18 }, // Total Marks Earned
      { wch: 18 }, // Total Possible Marks
      { wch: 16 }, // Average Score
      { wch: 15 }, // Total Code Runs
      { wch: 15 }, // Failed Attempts
      { wch: 15 }, // Success Rate
      { wch: 15 }, // Performance Grade
      { wch: 12 }, // Status
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Report');
    
    // Create summary sheet
    this.createSummarySheet(workbook, content);
    
    return workbook;
  }

  private createSummarySheet(workbook: XLSX.WorkBook, content: ExcelContent) {
    const { students, questions } = content;
    
    // Calculate summary statistics
    const totalStudents = students.length;
    const verifiedStudents = students.filter(s => s.isVerified).length;
    const activeStudents = students.filter(s => s.totalSubmissions > 0).length;
    const totalSubmissions = students.reduce((acc, s) => acc + s.totalSubmissions, 0);
    const totalMarksEarned = students.reduce((acc, s) => acc + s.totalMarksEarned, 0);
    const totalPossibleMarks = students.reduce((acc, s) => acc + s.totalPossibleMarks, 0);
    const averageScore = students.length > 0 
      ? Math.round(students.reduce((acc, s) => acc + s.averageScore, 0) / students.length)
      : 0;
    const totalCodeRuns = students.reduce((acc, s) => acc + s.totalCodeRuns, 0);
    
    const summaryData = [
      { 'Metric': 'Total Students', 'Value': totalStudents },
      { 'Metric': 'Verified Students', 'Value': verifiedStudents },
      { 'Metric': 'Active Students (with submissions)', 'Value': activeStudents },
      { 'Metric': 'Total Questions Available', 'Value': questions },
      { 'Metric': 'Total Submissions', 'Value': totalSubmissions },
      { 'Metric': 'Total Marks Earned', 'Value': totalMarksEarned },
      { 'Metric': 'Total Possible Marks', 'Value': totalPossibleMarks },
      { 'Metric': 'Overall Average Score (%)', 'Value': averageScore },
      { 'Metric': 'Total Code Runs', 'Value': totalCodeRuns },
      { 'Metric': 'Report Generated', 'Value': new Date(content.generatedAt).toLocaleString() }
    ];

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
  }

  private getPerformanceGrade(averageScore: number): string {
    if (averageScore >= 90) return 'A+';
    if (averageScore >= 80) return 'A';
    if (averageScore >= 70) return 'B';
    if (averageScore >= 60) return 'C';
    if (averageScore >= 50) return 'D';
    return 'F';
  }

  private getStudentStatus(completionRate: number, averageScore: number): string {
    if (completionRate >= 80 && averageScore >= 70) return 'Excellent';
    if (completionRate >= 60 && averageScore >= 60) return 'Good';
    if (completionRate >= 40 && averageScore >= 50) return 'Average';
    if (completionRate > 0) return 'Needs Improvement';
    return 'No Activity';
  }

  public downloadExcel(content: ExcelContent, filename: string) {
    const workbook = this.generateStudentsReport(content);
    XLSX.writeFile(workbook, filename);
  }
}


