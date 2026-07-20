import { PremiumModel } from "../database/models/Premium.js";
import { config } from "../config/config.js";

export type PremiumTier = "free" | "basic" | "standard" | "gold" | "enterprise";

const TIER_ORDER: PremiumTier[] = ["free", "basic", "standard", "gold", "enterprise"];

export async function getGuildTier(guildId: string): Promise<PremiumTier> {
  const record = await PremiumModel.findOne({ guildId }).lean();
  if (!record || !record.active) return "free";
  return (record.tier as PremiumTier) ?? "free";
}

export function tierAtLeast(current: PremiumTier, required: PremiumTier): boolean {
  return TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(required);
}

export async function isGuildPremium(guildId: string): Promise<boolean> {
  const tier = await getGuildTier(guildId);
  return tier !== "free";
}

export function getTierLimits(tier: PremiumTier) {
  return (config as any).limits[tier] ?? (config as any).limits.free;
}

export function getTierLabel(tier: PremiumTier): string {
  return (config as any).premium.tiers[tier]?.label ?? "Free";
}
