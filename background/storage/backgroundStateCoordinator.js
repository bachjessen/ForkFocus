/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

export function createBackgroundStateCoordinator({ execute, afterMutation = null }) {
  let queue = Promise.resolve();
  let sequence = 0;
  let failures = 0;
  let lastCommand = null;

  return {
    enqueue(message, context) {
      const operation = async () => {
        sequence += 1;
        lastCommand = message.command ?? null;
        try {
          const result = await execute(message, context);
          if (result.rebuildSnapshot && afterMutation) await afterMutation(result);
          return { ...result, sequence };
        } catch (error) {
          failures += 1;
          throw error;
        }
      };
      const result = queue.then(operation, operation);
      queue = result.catch(() => undefined);
      return result;
    },
    getDiagnostics() {
      return { sequence, failures, lastCommand };
    },
  };
}
