import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Submission {
  _id: string;
  questionId: string;
  code?: string;
  runCount: number;
  results: Array<{
    timestamp: string;
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
  createdAt: string;
  updatedAt: string;
}

interface Question {
  _id: string;
  questionId: string;
  title: string;
  description: string;
  questionType: string;
  topic: string;
  taxonomyLevel: string;
  marks: number;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    marks: number;
  }>;
}

interface PDFContent {
  student: Student;
  submissions: Submission[];
  questions: Question[];
  generatedAt: string;
}

export class PDFGenerator {
  private pdf: jsPDF;
  private currentY: number = 20;
  private pageWidth: number = 210;
  private margin: number = 20;
  private lineHeight: number = 7;
  private pageHeight: number = 297;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pdf.setFont('helvetica');
  }

  private addPageBreak() {
    if (this.currentY > this.pageHeight - 40) {
      this.pdf.addPage();
      this.currentY = 20;
    }
  }

  private addTitle(text: string, size: number = 16) {
    this.addPageBreak();
    this.pdf.setFontSize(size);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(text, this.margin, this.currentY);
    this.currentY += size + 5;
  }

  private addSubtitle(text: string, size: number = 12) {
    this.addPageBreak();
    this.pdf.setFontSize(size);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(text, this.margin, this.currentY);
    this.currentY += size + 3;
  }

  private addText(text: string, size: number = 10) {
    this.addPageBreak();
    this.pdf.setFontSize(size);
    this.pdf.setFont('helvetica', 'normal');
    
    // Handle text wrapping
    const maxWidth = this.pageWidth - (2 * this.margin);
    const lines = this.pdf.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      this.addPageBreak();
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  private cleanHTML(html: string) {
    return html
      .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
      .replace(/<\/p>/gi, '\n')     // Convert paragraph ends to newlines
      .replace(/<[^>]*>/g, '')      // Remove remaining tags
      .replace(/&nbsp;/g, ' ')      // Fix spaces
      .trim();
}

  private addCodeBlock(code: string, language: string = '') {
  this.pdf.setFontSize(8);
  this.pdf.setFont('courier', 'normal');
  
  const maxWidth = this.pageWidth - (2 * this.margin);
  const lines = this.pdf.splitTextToSize(code, maxWidth);
  
  lines.forEach((line: string) => {
    this.checkAndAddPage(); // CHECK EVERY LINE
    this.pdf.text(line, this.margin, this.currentY);
    this.currentY += 4;
  });
  
  this.currentY += 5;
}

private checkAndAddPage() {
  if (this.currentY > this.pageHeight - 20) { // 20mm bottom margin
    this.pdf.addPage();
    this.currentY = 20; // Reset to top margin
    return true;
  }
  return false;
}

  private addTable(headers: string[], data: string[][]) {
    this.addPageBreak();
    
    const colWidth = (this.pageWidth - (2 * this.margin)) / headers.length;
    const rowHeight = 8;
    
    // Draw headers
    this.pdf.setFillColor(200, 200, 200);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    
    headers.forEach((header, index) => {
      const x = this.margin + (index * colWidth);
      this.pdf.rect(x, this.currentY, colWidth, rowHeight, 'F');
      this.pdf.text(header, x + 2, this.currentY + 5);
    });
    
    this.currentY += rowHeight;
    
    // Draw data rows
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    data.forEach(row => {
      this.addPageBreak();
      row.forEach((cell, index) => {
        const x = this.margin + (index * colWidth);
        this.pdf.rect(x, this.currentY, colWidth, rowHeight, 'S');
        
        // Handle long text
        const cellText = this.pdf.splitTextToSize(cell, colWidth - 4);
        this.pdf.text(cellText[0] || '', x + 2, this.currentY + 5);
      });
      this.currentY += rowHeight;
    });
    
    this.currentY += 5;
  }

  public generateStudentReport(content: PDFContent): jsPDF {
    const { student, submissions, questions } = content;
    
    // Header
    this.addTitle('CodeGrade - Student Performance Report', 18);
    this.addText(`Generated on: ${new Date(content.generatedAt).toLocaleString()}`);
    this.currentY += 10;

    // Student Information
    this.addSubtitle('Student Information');
    this.addText(`Name: ${student.firstName} ${student.lastName}`);
    this.addText(`Email: ${student.email}`);
    this.addText(`Username: ${student.username}`);
    this.addText(`Registration Date: ${new Date(student.createdAt).toLocaleDateString()}`);
    this.addText(`Last Login: ${student.lastLogin ? new Date(student.lastLogin).toLocaleString() : 'Never'}`);
    this.addText(`Status: ${student.isVerified ? 'Verified' : 'Unverified'} | ${student.isBlocked ? 'Blocked' : 'Active'}`);
    this.currentY += 10;

    // Performance Summary
    this.addSubtitle('Performance Summary');
    const totalSubmissions = submissions.length;
    const totalQuestions = questions.length;
    const completedQuestions = submissions.filter(s => 
      s.results.some(r => r.failed === 0)
    ).length;
    const averageScore = submissions.length > 0 
      ? submissions.reduce((acc, s) => {
          const latestResult = s.results[s.results.length - 1];
          return acc + (latestResult?.score || 0);
        }, 0) / submissions.length
      : 0;

    this.addText(`Total Submissions: ${totalSubmissions}`);
    this.addText(`Questions Completed: ${completedQuestions}/${totalQuestions}`);
    this.addText(`Average Score: ${Math.round(averageScore)}%`);
    this.currentY += 10;

    // Detailed Submissions
    this.addSubtitle('Detailed Submissions');
    
    if (submissions.length === 0) {
      this.addText('No submissions found for this student.');
    } else {
      submissions.forEach((submission, index) => {
        const question = questions.find(q => q._id === submission.questionId);
        const latestResult = submission.results[submission.results.length - 1];
        
        this.addSubtitle(`${index + 1}. ${question?.title || 'Unknown Question'}`, 11);
        this.addText(`Question ID: ${question?.questionId || 'N/A'}`);
        this.addText(`Topic: ${question?.topic || 'N/A'}`);
        this.addText(`Type: ${question?.questionType || 'N/A'}`);
        this.addText(`Marks: ${latestResult?.marksEarned || 0}/${latestResult?.totalMarks || 0}`);
        this.addText(`Score: ${latestResult?.score || 0}%`);
        this.addText(`Run Count: ${submission.runCount}`);
        this.addText(`Test Cases Passed: ${latestResult?.passed || 0}/${(latestResult?.passed || 0) + (latestResult?.failed || 0)}`);
        this.addText(`Last Attempt: ${latestResult?.timestamp ? new Date(latestResult.timestamp).toLocaleString() : 'Never'}`);
        
        // Add question description
        if (question?.description) {
          this.addText('Question Description:');
          this.addText(question.description.replace(/<[^>]*>/g, '')); // Remove HTML tags
        }
        
        // Add submitted code
        if (submission.code) {
          this.addText('Submitted Code:');
          this.addCodeBlock(submission.code, 'Code');
        }
        
        // Add test case results if available
        if (latestResult?.testCaseResults && latestResult.testCaseResults.length > 0) {
          this.addText('Test Case Results:');
          const testCaseData = latestResult.testCaseResults.map((tc, i) => [
            `TC ${i + 1}`,
            tc.input,
            tc.expected,
            tc.output,
            tc.pass ? 'PASS' : 'FAIL',
            `${tc.marks}`
          ]);
          
          this.addTable(
            ['Test Case', 'Input', 'Expected', 'Output', 'Result', 'Marks'],
            testCaseData
          );
        }
        
        this.currentY += 10;
      });
    }

    return this.pdf;
  }

  public downloadPDF(content: PDFContent, filename: string) {
    const pdf = this.generateStudentReport(content);
    pdf.save(filename);
  }
}


