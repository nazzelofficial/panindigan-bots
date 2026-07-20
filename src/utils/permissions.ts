import type { GuildMember } from "discord.js";
import { getOwnerIds } from "../config/config.js";
import { GuildModel } from "../database/models/Guild.js";
import { CoOwnerModel } from "../database/models/System.js";
import type { AccessTier } from "../structures/types.js";

const TIER_RANK: Record<AccessTier, number> = {
  general: 0,
  moderator: 1,
  admin: 2,
  coowner: 3,
  owner: 4,
};

export function isBotOwner(userId: string): boolean {
  return getOwnerIds().includes(userId);
}

export async function isCoOwner(userId: string): Promise<boolean> {
  if (isBotOwner(userId)) return true;
  const record = await CoOwnerModel.findOne({ userId }).lean();
  return Boolean(record);
}

/**
 * Resolves the highest access tier a member qualifies for, checking bot
 * owner/co-owner status first, then the guild's configured admin/mod roles,
 * then falling back to Discord's native Administrator permission for admin
 * tier (so servers that haven't run `adminrole add` yet still work).
 */
export async function resolveAccessTier(member: GuildMember | null, userId: string): Promise<AccessTier> {
  if (isBotOwner(userId)) return "owner";
  if (await isCoOwner(userId)) return "coowner";
  if (!member) return "general";

  if (member.permissions.has("Administrator")) return "admin";

  const guildConfig = await GuildModel.findOne({ guildId: member.guild.id }).lean();
  if (guildConfig) {
    if (member.roles.cache.some((r) => guildConfig.adminRoleIds?.includes(r.id))) return "admin";
    if (member.roles.cache.some((r) => guildConfig.modRoleIds?.includes(r.id))) return "moderator";
  }

  return "general";
}

export function tierSatisfies(actual: AccessTier, required: AccessTier): boolean {
  return TIER_RANK[actual] >= TIER_RANK[required];
}

export const TIER_LABELS: Record<AccessTier, string> = {
  owner: "👑 Bot Owner",
  coowner: "🤝 Co-Owner",
  admin: "🔐 Administrator",
  moderator: "🛡️ Moderator",
  general: "🌍 Member",
};
