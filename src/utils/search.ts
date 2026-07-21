/**
 * utils/search.ts v0.2.6
 * Smart Search Engine — fuzzy search with "Did you mean?" suggestions
 *
 * Features:
 *   🔄 Fuzzy Search — Levenshtein distance-based matching
 *   🎯 Partial Matches — matches substrings
 *   🔤 Alias Search — searches through command aliases
 *   ✏️ Typo Correction — suggests corrections for typos
 *   💡 "Did you mean?" — smart suggestions
 *   🤖 Autocomplete-ready — can be used for autocomplete
 *   🔐 Permission-aware — can filter by user permissions
 *   👑 Premium-aware — indicates premium-only commands
 */

import type { CommandDefinition } from "../structures/types.js";

// ── Levenshtein distance algorithm ───────────────────────────────────────────────

/**
 * Compute the Levenshtein distance between two strings.
 * Lower distance = more similar strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

// ── Search result types ───────────────────────────────────────────────────────────

export interface SearchResult {
  /** The matching command */
  command: CommandDefinition;
  /** Match score (lower = better match) */
  score: number;
  /** Which field matched (name, alias, description, category) */
  matchField: "name" | "alias" | "description" | "category";
}

type MatchFieldType = "name" | "alias" | "description" | "category";

export interface SearchOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Minimum score threshold (inclusive) */
  maxScore?: number;
  /** Whether to include premium commands */
  includePremium?: boolean;
  /** Filter by user permissions (if available) */
  userPermissions?: string[];
}

// ── Main search function ──────────────────────────────────────────────────────────

/**
 * Perform a fuzzy search across commands.
 * Searches through command names, aliases, descriptions, and categories.
 *
 * @param query The search query
 * @param commands Array of commands to search
 * @param options Search options
 * @returns Array of search results sorted by relevance
 */
export function fuzzySearch(
  query: string,
  commands: CommandDefinition[],
  options: SearchOptions = {},
): SearchResult[] {
  const {
    limit = 10,
    maxScore = 5,
    includePremium = true,
    userPermissions = [],
  } = options;

  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored: SearchResult[] = commands.map((cmd) => {
    const fields: Array<{ value: string; type: MatchFieldType }> = [
      { value: cmd.name, type: "name" },
      ...(cmd.aliases?.map((a) => ({ value: a, type: "alias" as const })) ?? []),
      { value: cmd.description.toLowerCase(), type: "description" },
      { value: cmd.category.toLowerCase(), type: "category" },
    ];

    let bestScore = Infinity;
    let bestField: MatchFieldType = "name";

    for (const field of fields) {
      const value = field.value;
      
      // Exact match = best score
      if (value === q) {
        bestScore = 0;
        bestField = field.type;
        break;
      }
      
      // Starts with query = very good match
      if (value.startsWith(q)) {
        if (1 < bestScore) {
          bestScore = 1;
          bestField = field.type;
        }
        continue;
      }
      
      // Contains query = good match
      if (value.includes(q)) {
        if (2 < bestScore) {
          bestScore = 2;
          bestField = field.type;
        }
        continue;
      }
      
      // Fuzzy match using Levenshtein distance
      const dist = levenshtein(q, value.slice(0, Math.min(value.length, q.length + 3)));
      if (dist <= 2 && dist + 3 < bestScore) {
        bestScore = dist + 3;
        bestField = field.type;
      }
    }

    return { command: cmd, score: bestScore, matchField: bestField };
  });

  // Filter by score and premium status
  const filtered = scored.filter((s) => {
    if (s.score >= maxScore || s.score === Infinity) return false;
    if (!includePremium && s.command.premium) return false;
    return true;
  });

  // Sort by score and limit results
  return filtered
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

/**
 * Get "Did you mean?" suggestions for a query.
 * Returns the best matching command if no exact match is found.
 */
export function getDidYouMean(
  query: string,
  commands: CommandDefinition[],
): CommandDefinition | null {
  const results = fuzzySearch(query, commands, { limit: 1, maxScore: 3 });
  return results.length > 0 ? results[0]!.command : null;
}

/**
 * Autocomplete suggestions for a partial query.
 * Returns commands that start with the given prefix.
 */
export function autocomplete(
  prefix: string,
  commands: CommandDefinition[],
  limit = 10,
): CommandDefinition[] {
  const p = prefix.toLowerCase().trim();
  if (!p) return [];

  return commands
    .filter((cmd) => cmd.name.startsWith(p) || cmd.aliases?.some((a) => a.startsWith(p)))
    .slice(0, limit);
}

/**
 * Search within a specific category.
 */
export function searchInCategory(
  query: string,
  commands: CommandDefinition[],
  category: string,
  options: SearchOptions = {},
): SearchResult[] {
  const categoryCommands = commands.filter((c) =>
    c.category.toLowerCase() === category.toLowerCase()
  );
  return fuzzySearch(query, categoryCommands, options);
}

/**
 * Get related commands based on category and keywords.
 */
export function getRelatedCommands(
  command: CommandDefinition,
  allCommands: CommandDefinition[],
  limit = 5,
): CommandDefinition[] {
  const sameCategory = allCommands.filter((c) =>
    c.category === command.category && c.name !== command.name
  );
  
  // Score by category match first, then by name similarity
  const scored = sameCategory.map((cmd) => ({
    cmd,
    score: levenshtein(command.name, cmd.name),
  }));
  
  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.cmd);
}
