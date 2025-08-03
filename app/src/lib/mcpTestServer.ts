import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

export interface TestResult {
  success: boolean;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failures: TestFailure[];
  summary: string;
}

export interface TestFailure {
  test: string;
  error: string;
  file: string;
  line?: number;
}

export class MCPTestServer {
  private testResultsPath = path.join(process.cwd(), "test-results");
  private maxRetries = 3;

  constructor() {
    this.ensureTestResultsDir();
  }

  private async ensureTestResultsDir() {
    try {
      await fs.mkdir(this.testResultsPath, { recursive: true });
    } catch (error) {
      console.warn("Could not create test-results directory:", error);
    }
  }

  /**
   * Run specific test files or patterns
   */
  async runTests(testPattern?: string, retryCount = 0): Promise<TestResult> {
    try {
      const command = testPattern
        ? `npx playwright test ${testPattern} --reporter=json`
        : `npx playwright test --reporter=json`;

      console.log(`🧪 Running tests: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes timeout
      });

      const result = await this.parseTestResults(stdout);

      if (!result.success && retryCount < this.maxRetries) {
        console.log(
          `❌ Tests failed (attempt ${retryCount + 1}/${this.maxRetries + 1}). Retrying...`,
        );
        return this.runTests(testPattern, retryCount + 1);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (retryCount < this.maxRetries) {
        console.log(
          `❌ Test execution failed (attempt ${retryCount + 1}/${this.maxRetries + 1}). Retrying...`,
        );
        return this.runTests(testPattern, retryCount + 1);
      }

      return {
        success: false,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        failures: [
          {
            test: "Test Execution",
            error: errorMessage,
            file: "unknown",
          },
        ],
        summary: `Test execution failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Run tests for specific feature areas
   */
  async runFeatureTests(
    feature: "auth" | "theme" | "calendar" | "all",
  ): Promise<TestResult> {
    const testPatterns = {
      auth: "tests/auth/**/*.spec.ts",
      theme: "tests/theme/**/*.spec.ts",
      calendar: "tests/calendar/**/*.spec.ts",
      all: "tests/**/*.spec.ts",
    };

    return this.runTests(testPatterns[feature]);
  }

  /**
   * Run component-specific tests
   */
  async runComponentTests(component: string): Promise<TestResult> {
    return this.runTests(`tests/components/**/*${component}*.spec.ts`);
  }

  /**
   * Run end-to-end workflow tests
   */
  async runE2ETests(): Promise<TestResult> {
    return this.runTests("tests/e2e/**/*.spec.ts");
  }

  /**
   * Run regression tests
   */
  async runRegressionTests(): Promise<TestResult> {
    return this.runTests("tests/regression/**/*.spec.ts");
  }

  /**
   * Parse Playwright JSON output
   */
  private async parseTestResults(output: string): Promise<TestResult> {
    try {
      const jsonOutput = JSON.parse(output);

      const stats = jsonOutput.stats || {};
      const suites = jsonOutput.suites || [];

      const failures: TestFailure[] = [];

      // Extract failures from test suites
      const extractFailures = (suite: any) => {
        if (suite.specs) {
          suite.specs.forEach((spec: any) => {
            spec.tests?.forEach((test: any) => {
              test.results?.forEach((result: any) => {
                if (result.status === "failed") {
                  failures.push({
                    test: `${suite.title} > ${spec.title}`,
                    error: result.error?.message || "Unknown error",
                    file: suite.file || "unknown",
                    line: result.error?.location?.line,
                  });
                }
              });
            });
          });
        }

        if (suite.suites) {
          suite.suites.forEach(extractFailures);
        }
      };

      suites.forEach(extractFailures);

      const passed = stats.passed || 0;
      const failed = stats.failed || 0;
      const skipped = stats.skipped || 0;
      const duration = stats.duration || 0;

      return {
        success: failed === 0,
        passed,
        failed,
        skipped,
        duration,
        failures,
        summary: `${passed} passed, ${failed} failed, ${skipped} skipped (${duration}ms)`,
      };
    } catch (error) {
      console.error("Failed to parse test results:", error);
      return {
        success: false,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        failures: [
          {
            test: "Result Parsing",
            error: "Failed to parse test results",
            file: "unknown",
          },
        ],
        summary: "Failed to parse test results",
      };
    }
  }

  /**
   * Generate test report
   */
  async generateReport(): Promise<string> {
    try {
      const { stdout } = await execAsync(
        "npx playwright show-report --reporter=html",
      );
      return stdout;
    } catch (error) {
      return `Failed to generate report: ${error}`;
    }
  }
}

// Singleton instance
export const mcpTestServer = new MCPTestServer();
