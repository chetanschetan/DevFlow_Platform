import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface CompilerResult {
  output: string;
  statusCode: number;
  memory: string;
  cpuTime: string;
  error?: string;
}

export class LocalCompilerService {
  // private static tempDir = path.join(os.tmpdir(), 'codegrade-java');
  private static tempDir = path.join(os.tmpdir(), 'codify-java');

  private static javaPath = 'java';
  private static javacPath = 'javac';

  static async initialize(): Promise<void> {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Check if Java is installed
    try {
      await execAsync(`${this.javaPath} -version`);
      await execAsync(`${this.javacPath} -version`);
      console.log('---->Java compiler initialized successfully');
    } catch (error) {
      console.error('---->Java compiler initialization failed:', error);
      throw new Error('Java is not installed or not in PATH. Please install Java JDK.');
    }
  }

  static async executeJavaCode(code: string, input: string = '', studentId?: string, useStdin: boolean = false): Promise<CompilerResult> {
    const startTime = Date.now();
    let tempFile: string | undefined;
    
    try {
      // Ensure the code has a main method and get the class name
      const { javaCode, className } = this.ensureMainMethod(code);
      
      // Create student-specific directory
      const studentDir = studentId ? path.join(this.tempDir, studentId) : this.tempDir;
      if (!fs.existsSync(studentDir)) {
        fs.mkdirSync(studentDir, { recursive: true });
      }
      
      // Create temp file with the correct class name in student directory
      tempFile = path.join(studentDir, `${className}.java`);
      
      // Write code to temporary file
      fs.writeFileSync(tempFile, javaCode);
      
      // Compile the Java code
      const compileResult = await this.compileJava(tempFile, studentDir);
      if (compileResult.statusCode !== 0) {
        return {
          output: '',
          statusCode: 1,
          memory: '0',
          cpuTime: '0',
          error: compileResult.error || 'Compilation failed'
        };
      }

      // Execute the compiled code
      const executeResult = await this.executeJava(tempFile.replace('.java', '.class'), input, className, studentDir, useStdin);
      const endTime = Date.now();
      
      // If execution failed, return the error
      if (executeResult.statusCode !== 0) {
        return {
          output: executeResult.output,
          statusCode: executeResult.statusCode,
          memory: '0',
          cpuTime: `${endTime - startTime}ms`,
          error: executeResult.error || `Runtime error (exit code: ${executeResult.statusCode})`
        };
      }
      
      return {
        output: executeResult.output,
        statusCode: executeResult.statusCode,
        memory: '0', // Local execution doesn't provide memory usage
        cpuTime: `${endTime - startTime}ms`,
        error: executeResult.error
      };
    } catch (error) {
      return {
        output: '',
        statusCode: 1,
        memory: '0',
        cpuTime: '0',
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    } finally {
      // Clean up temporary files
      if (tempFile) {
        this.cleanupFiles(tempFile);
      }
    }
  }

//   private static ensureMainMethod(code: string): { javaCode: string; className: string } {
//     // Check if the code already has a main method
//     if (code.includes('public static void main(String[] args)')) {
//       // Extract the class name from the original code
//       const classMatch = code.match(/public class (\w+)/);
//       if (classMatch) {
//         return { javaCode: code, className: classMatch[1] };
//       }
//       // If no class found, create a Main class
//       return { 
//         javaCode: `public class Main {
//     public static void main(String[] args) {
//         ${code}
//     }
// }`, 
//         className: 'Main' 
//       };
//     }

//     // If no main method, wrap the code in a class with main method
//     return { 
//       javaCode: `public class Main {
//     public static void main(String[] args) {
//         ${code}
//     }
// }`, 
//       className: 'Main' 
//     };
//   }

private static ensureMainMethod(code: string): { javaCode: string; className: string } {
  // Set the default fallback values
  let finalJavaCode = `public class Main {
    public static void main(String[] args) {
        ${code}
    }
  }`;
  let finalClassName = 'Main';

  // Check if the student provided BOTH a main method AND a public class
  if (code.includes('public static void main(String[] args)')) {
    const classMatch = code.match(/public class (\w+)/);
    
    if (classMatch) {
      // If we found a specific class name, use the student's original code
      finalJavaCode = code;
      finalClassName = classMatch[1];
    }
  }

  // One single return for all scenarios
  return { javaCode: finalJavaCode, className: finalClassName };
}

  private static async compileJava(filePath: string, workingDir: string): Promise<{ statusCode: number; error?: string }> {
    return new Promise((resolve) => {
      const javac = spawn(this.javacPath, [filePath], {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let errorOutput = '';
      javac.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      javac.on('close', (code) => {
        resolve({
          statusCode: code || 0,
          error: errorOutput || undefined
        });
      });
    });
  }

  private static async executeJava(classPath: string, input: string, className: string, workingDir: string, useStdin: boolean = false): Promise<{ output: string; statusCode: number; error?: string }> {
    return new Promise((resolve) => {
      let java;
      
      if (useStdin) {
        // For input scanning questions (like Scanner input)
        java = spawn(this.javaPath, ['-cp', workingDir, className], {
          cwd: workingDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } else {
        // For command-line argument questions
        // Parse input string into command-line arguments
        // For "2 3", this should become ["2", "3"]
        const args = input.trim() ? input.trim().split(/\s+/) : [];
        
        java = spawn(this.javaPath, ['-cp', workingDir, className, ...args], {
          cwd: workingDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      }

      let output = '';
      let errorOutput = '';

      java.stdout.on('data', (data) => {
        output += data.toString();
      });

      java.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      if (useStdin && input) {
        // Send input to the process via stdin
        java.stdin.write(input);
        java.stdin.end();
      } else {
        // Close stdin immediately since we're using command-line arguments
        java.stdin.end();
      }

      java.on('close', (code) => {
        resolve({
          output: output.trim(),
          statusCode: code || 0,
          error: errorOutput || undefined
        });
      });

      // Set a timeout to kill the process if it runs too long (5 seconds)
      setTimeout(() => {
        java.kill('SIGKILL');
        resolve({
          output: '',
          statusCode: 1,
          error: 'Execution timeout (5 seconds)'
        });
      }, 5000);
    });
  }

  private static cleanupFiles(javaFile: string): void {
    try {
      const classFile = javaFile.replace('.java', '.class');
      if (fs.existsSync(javaFile)) {
        fs.unlinkSync(javaFile);
      }
      if (fs.existsSync(classFile)) {
        fs.unlinkSync(classFile);
      }
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  }

  static compareOutputs(actual: string, expected: string): boolean {
    // Normalize whitespace and line endings
    const normalizeOutput = (str: string) => 
      str.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
    
    return normalizeOutput(actual) === normalizeOutput(expected);
  }

  static async runTestCases(code: string, testCases: Array<{ input: string; expectedOutput: string; marks: number }>, studentId?: string, useStdin: boolean = false) {
    const results = [];
    let passed = 0;
    let failed = 0;
    let marksEarned = 0;
    let totalMarks = 0;

    // Handle case where there are no test cases
    if (!testCases || testCases.length === 0) {
      return {
        passed: 0,
        failed: 0,
        score: 0,
        marksEarned: 0,
        totalMarks: 0,
        testCaseResults: []
      };
    }

    for (const testCase of testCases) {
      try {
        // For command-line argument questions, use useStdin: false
        // For input scanning questions, use useStdin: true
        const result = await this.executeJavaCode(code, testCase.input, studentId, useStdin);
        const pass = this.compareOutputs(result.output, testCase.expectedOutput);
        
        results.push({
          input: testCase.input,
          output: result.output,
          expected: testCase.expectedOutput,
          pass,
          marks: testCase.marks
        });
        
        totalMarks += testCase.marks;
        if (pass) {
          passed++;
          marksEarned += testCase.marks;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Test case execution error:', error);
        results.push({
          input: testCase.input,
          output: '',
          expected: testCase.expectedOutput,
          pass: false,
          marks: testCase.marks
        });
        totalMarks += testCase.marks;
        failed++;
      }
    }

    // Calculate score with proper validation
    let score = 0;
    if (totalMarks > 0) {
      score = Math.round((marksEarned / totalMarks) * 100);
      // Ensure score is within valid range
      score = Math.max(0, Math.min(100, score));
    }

    return {
      passed,
      failed,
      score,
      marksEarned,
      totalMarks,
      testCaseResults: results
    };
  }
} 