/**
 * Console error interceptor for login failures
 * This file intercepts console.error calls and handles them appropriately
 */

import { authService } from "@/services/auth.service";

// Store original console.error
const originalConsoleError = console.error;

// Override console.error to intercept login failures
console.error = function(...args: any[]) {
  // Check if this is a login failure from auth.service.ts
  if (args.length >= 2 && args[0] === "intercept-console-error.ts:44 Login failed:") {
    const errorMessage = args[1];

    // Handle login failure - you can add custom logic here
    // For example, log to external service, show notification, etc.
    console.warn("🔐 Login failure intercepted:", errorMessage);

    // You could also emit an event or call a callback here
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("loginFailure", {
        detail: { message: errorMessage }
      }));
    }

    // Don't call original console.error to suppress the log
    return;
  }

  // For all other console.error calls, use the original
  originalConsoleError.apply(console, args);
};

// Export a function to restore original console.error if needed
export function restoreConsoleError() {
  console.error = originalConsoleError;
}

// Export a function to intercept specific error patterns
export function interceptConsoleError(pattern: string, handler: (message: string) => void) {
  const originalError = console.error;

  console.error = function(...args: any[]) {
    const message = args.join(" ");
    if (message.includes(pattern)) {
      handler(message);
      return; // Suppress the error
    }
    originalError.apply(console, args);
  };
}
