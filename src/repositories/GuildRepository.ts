/**
 * repositories/GuildRepository.ts v0.2.6
 * Repository pattern — clean data access layer for guild configuration.
 *
 * v0.2.6 Database spec:
 *   🗂️ Repository Pattern  — Clean data access layer separation
 *   🔁 Retry Logic         — Exponential backoff on failed queries
 *   🧊 Caching Layer       — Redis-compatible in-memory caching
 *   🔄 Transactions        — Atomic operations for data integrity
 *
 * Performance targets:
 *   Simple SELECT  < 5 ms  (cache hit)
 *   Complex query  < 20 ms (cache miss → DB)
 */

import { GuildModel } from "../database/models/Guild.js";
import { botCache, CACHE_TTL } from "../utils/cache.js";
import { withRetry } from "../lib/retry.js";
import { DatabaseError, DocumentNotFoundError } from "../lib/errors.js";
import { dbLog } from "../utils/logger.js";
import type { GuildConfigDTO } from "../types/dtos.js";

const CACHE_PREFIX = "guild:config:";
const TTL          = CACHE_TTL.GUILD_CONFIG;

// ── Helpers ───────────────────────────────────────────────────────────────────

function cacheKey(guildId: string): string {
  return `${CACHE_PREFIX}${guildId}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(doc: any): GuildConfigDTO {
  return {
    guildId:          doc.guildId        ?? doc._id?.toString() ?? "",
    prefix:           doc.prefix         ?? "P!",
    language:         doc.language       ?? "en",
    premiumTier:      doc.premiumTier    ?? 0,
    adminRoleIds:     doc.adminRoles     ?? [],
    modRoleIds:       doc.modRoles       ?? [],
    muteRoleId:       doc.muteRole       ?? null,
    logChannelId:     doc.logChannel     ?? null,
    welcomeChannelId: doc.welcomeChannel ?? null,
    goodbyeChannelId: doc.goodbyeChannel ?? null,
    updatedAt:        doc.updatedAt      ?? new Date(),
  };
}

// ── Repository ────────────────────────────────────────────────────────────────

export const GuildRepository = {

  /**
   * Fetch guild config — cache hit returns in < 1 ms, DB miss in < 20 ms.
   * Creates a default config document when none exists (upsert pattern).
   */
  async findById(guildId: string): Promise<GuildConfigDTO> {
    const cached = botCache.get<GuildConfigDTO>(cacheKey(guildId));
    if (cached) return cached;

    const t0 = Date.now();
    const doc = await withRetry(
      () => GuildModel.findOne({ guildId }).lean().exec(),
      { label: `guild-find:${guildId}` },
    );

    dbLog.debug("GuildRepository.findById", { guildId, ms: Date.now() - t0, hit: !!doc });

    if (!doc) {
      // Upsert: create default doc and return its DTO
      return GuildRepository.upsert(guildId, {});
    }

    const dto = toDTO(doc);
    botCache.set(cacheKey(guildId), dto, TTL);
    return dto;
  },

  /**
   * Update guild config fields atomically. Invalidates the cache.
   */
  async update(guildId: string, patch: Partial<Omit<GuildConfigDTO, "guildId" | "updatedAt">>): Promise<GuildConfigDTO> {
    const t0  = Date.now();
    const raw: Record<string, unknown> = {};

    if (patch.prefix           !== undefined) raw["prefix"]         = patch.prefix;
    if (patch.language         !== undefined) raw["language"]       = patch.language;
    if (patch.premiumTier      !== undefined) raw["premiumTier"]    = patch.premiumTier;
    if (patch.adminRoleIds     !== undefined) raw["adminRoles"]     = patch.adminRoleIds;
    if (patch.modRoleIds       !== undefined) raw["modRoles"]       = patch.modRoleIds;
    if (patch.muteRoleId       !== undefined) raw["muteRole"]       = patch.muteRoleId;
    if (patch.logChannelId     !== undefined) raw["logChannel"]     = patch.logChannelId;
    if (patch.welcomeChannelId !== undefined) raw["welcomeChannel"] = patch.welcomeChannelId;
    if (patch.goodbyeChannelId !== undefined) raw["goodbyeChannel"] = patch.goodbyeChannelId;

    const doc = await withRetry(
      () => GuildModel.findOneAndUpdate(
        { guildId },
        { $set: { ...raw, updatedAt: new Date() } },
        { new: true, upsert: true, lean: true },
      ).exec(),
      { label: `guild-update:${guildId}` },
    );

    if (!doc) throw new DatabaseError(`Failed to update guild ${guildId}`, "findOneAndUpdate");

    const dto = toDTO(doc);
    botCache.set(cacheKey(guildId), dto, TTL);
    dbLog.info("GuildRepository.update", { guildId, fields: Object.keys(raw), ms: Date.now() - t0 });
    return dto;
  },

  /**
   * Upsert — create or fully overwrite a guild config.
   */
  async upsert(guildId: string, data: Partial<Omit<GuildConfigDTO, "guildId">>): Promise<GuildConfigDTO> {
    const doc = await withRetry(
      () => GuildModel.findOneAndUpdate(
        { guildId },
        { $setOnInsert: { guildId }, $set: { updatedAt: new Date(), ...data } },
        { new: true, upsert: true, lean: true },
      ).exec(),
      { label: `guild-upsert:${guildId}` },
    );

    if (!doc) throw new DatabaseError(`Failed to upsert guild ${guildId}`, "upsert");

    const dto = toDTO(doc);
    botCache.set(cacheKey(guildId), dto, TTL);
    return dto;
  },

  /**
   * Delete all guild data. Invalidates the cache.
   */
  async delete(guildId: string): Promise<void> {
    await withRetry(
      () => GuildModel.deleteOne({ guildId }).exec(),
      { label: `guild-delete:${guildId}` },
    );
    botCache.delete(cacheKey(guildId));
    dbLog.info("GuildRepository.delete", { guildId });
  },

  /**
   * Invalidate the cache for a guild (e.g. after external write).
   */
  invalidateCache(guildId: string): void {
    botCache.delete(cacheKey(guildId));
  },

  /**
   * Check premium tier for a guild.
   */
  async getPremiumTier(guildId: string): Promise<number> {
    const config = await GuildRepository.findById(guildId);
    return config.premiumTier;
  },

  /**
   * Get prefix for a guild (used by prefix command handler on every message).
   * Cache hit path: ~0ms.
   */
  async getPrefix(guildId: string): Promise<string> {
    const config = await GuildRepository.findById(guildId);
    return config.prefix;
  },

} as const;
