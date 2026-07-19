/**
 * Backward-compatibility shim.
 * Old command files import `CommandDefinition` from this path.
 * The runtime shim in commandHandler.ts converts old-pattern
 * (data + accessTier + execute(interaction)) to the new RunContext
 * pipeline automatically. This re-export just satisfies the import
 * so those files can load without error.
 */
export type { CommandDefinition } from "./types";
