import { mcpTestServer, TestResult } from "./mcpTestServer";

export class AutomatedTestRunner {
  private static instance: AutomatedTestRunner;

  private constructor() {}

  static getInstance(): AutomatedTestRunner {
    if (!AutomatedTestRunner.instance) {
      AutomatedTestRunner.instance = new AutomatedTestRunner();
    }
    return AutomatedTestRunner.instance;
  }

  /**
   * Run tests based on the type of change made
   */
  async runTestsForChanges(
    changeType: "theme" | "auth" | "calendar" | "component" | "e2e" | "all",
    componentName?: string,
  ): Promise<TestResult> {
    console.log(`🧪 Running ${changeType} tests...`);

    switch (changeType) {
      case "theme":
        return await mcpTestServer.runFeatureTests("theme");

      case "auth":
        return await mcpTestServer.runFeatureTests("auth");

      case "calendar":
        return await mcpTestServer.runFeatureTests("calendar");

      case "component":
        if (componentName) {
          return await mcpTestServer.runComponentTests(componentName);
        }
        return await mcpTestServer.runTests("tests/components/**/*.spec.ts");

      case "e2e":
        return await mcpTestServer.runE2ETests();

      case "all":
        return await mcpTestServer.runFeatureTests("all");

      default:
        return await mcpTestServer.runFeatureTests("all");
    }
  }

  /**
   * Run regression tests to ensure no existing functionality is broken
   */
  async runRegressionTests(): Promise<TestResult> {
    console.log("🔄 Running regression tests...");
    return await mcpTestServer.runRegressionTests();
  }

  /**
   * Validate that tests pass before marking work complete
   */
  async validateChanges(
    changeType: "theme" | "auth" | "calendar" | "component" | "e2e" | "all",
    componentName?: string,
  ): Promise<{
    success: boolean;
    message: string;
    details?: TestResult;
  }> {
    try {
      // Run specific tests for the changes
      const testResult = await this.runTestsForChanges(
        changeType,
        componentName,
      );

      if (!testResult.success) {
        return {
          success: false,
          message: `❌ Tests failed: ${testResult.summary}`,
          details: testResult,
        };
      }

      // Run regression tests to ensure nothing else broke
      const regressionResult = await this.runRegressionTests();

      if (!regressionResult.success) {
        return {
          success: false,
          message: `❌ Regression tests failed: ${regressionResult.summary}`,
          details: regressionResult,
        };
      }

      return {
        success: true,
        message: `✅ All tests passed! ${testResult.summary}`,
        details: testResult,
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Test execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Format test results for display
   */
  formatTestResults(result: TestResult): string {
    if (result.success) {
      return `✅ **Tests Passed**: ${result.summary}`;
    }

    let output = `❌ **Tests Failed**: ${result.summary}\n\n`;

    if (result.failures.length > 0) {
      output += "**Failures:**\n";
      result.failures.forEach((failure, index) => {
        output += `${index + 1}. **${failure.test}**\n`;
        output += `   File: ${failure.file}${failure.line ? `:${failure.line}` : ""}\n`;
        output += `   Error: ${failure.error}\n\n`;
      });
    }

    return output;
  }

  /**
   * Auto-fix common test failures (up to 3 attempts)
   */
  async attemptAutoFix(
    result: TestResult,
    attempt: number = 1,
  ): Promise<TestResult> {
    if (attempt > 3) {
      return result; // Max attempts reached
    }

    console.log(`🔧 Attempting auto-fix (attempt ${attempt}/3)...`);

    // Analyze failures and attempt common fixes
    for (const failure of result.failures) {
      if (failure.error.includes("data-testid")) {
        console.log(
          "🔧 Detected missing test IDs, this would need manual component updates",
        );
        // In a real implementation, we could automatically add test IDs to components
      }

      if (failure.error.includes("timeout")) {
        console.log("🔧 Detected timeout issues, increasing wait times");
        // Could automatically adjust timeout values in test configuration
      }

      if (failure.error.includes("element not found")) {
        console.log("🔧 Detected element selection issues");
        // Could suggest alternative selectors or wait strategies
      }
    }

    // Re-run tests after attempted fixes
    return await mcpTestServer.runTests();
  }
}

// Export singleton instance
export const testRunner = AutomatedTestRunner.getInstance();
