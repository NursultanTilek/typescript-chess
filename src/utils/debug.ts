/**
 * Debug utility for conditional logging
 * Only logs in development mode, silent in production
 */

const isDevelopment = import.meta.env.DEV;

export const debug = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  // Always log critical errors even in production
  critical: (...args: unknown[]) => {
    console.error('[CRITICAL]', ...args);
  }
};
