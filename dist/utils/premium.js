import { PremiumModel } from "../database/models/Premium";
import { config } from "../config/config";
const TIER_ORDER = ["free", "basic", "standard", "gold", "enterprise"];
export async function getGuildTier(guildId) {
    const record = await PremiumModel.findOne({ guildId }).lean();
    if (!record || !record.active)
        return "free";
    return record.tier ?? "free";
}
export function tierAtLeast(current, required) {
    return TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(required);
}
export async function isGuildPremium(guildId) {
    const tier = await getGuildTier(guildId);
    return tier !== "free";
}
export function getTierLimits(tier) {
    return config.limits[tier] ?? config.limits.free;
}
export function getTierLabel(tier) {
    return config.premium.tiers[tier]?.label ?? "Free";
}
//# sourceMappingURL=premium.js.map