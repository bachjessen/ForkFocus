/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

export function createStorageMutationPolicy({ contract }) {
  const commands = contract.semanticCommands;
  const contentCommands = new Set([
    commands.patchLocalState,
    commands.dailyLimitPatchState,
  ]);

  return {
    assertAllowed(command, { source }) {
      if (!Object.values(commands).includes(command)) {
        throw new Error("unknown_semantic_command");
      }
      if (source === "background") return;
      if (source === "extension") return;
      if (source === "content" && contentCommands.has(command)) return;
      throw new Error(`mutation_forbidden:${source}:${command}`);
    },
  };
}
