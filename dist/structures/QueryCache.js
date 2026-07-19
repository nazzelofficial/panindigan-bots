/**
 * QueryCache — named re-export of the shared TTL cache for use in DB query
 * wrappers that need a distinct import path from the generic botCache.
 *
 * Usage:
 *   import { queryCache, QUERY_TTL } from "@/structures/QueryCache";
 *   const config = queryCache.get<GuildConfig>(`guild:${guildId}`)
 *                   ?? await fetchAndCache(...);
 */
export { botCache as queryCache, CACHE_TTL as QUERY_TTL } from "@/utils/cache";
//# sourceMappingURL=QueryCache.js.map