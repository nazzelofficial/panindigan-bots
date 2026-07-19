import { PremiumModel } from "@/database/models/Premium";
import { baseEmbed, infoEmbed } from "@/utils/embeds";
const TIER_LABELS = {
    none: "Free",
    basic: "🥈 Basic",
    standard: "🥇 Standard",
    gold: "👑 Gold",
    enterprise: "💠 Enterprise",
};
const command = {
    name: "premiumstatus",
    description: "View the premium status and active features for this server",
    category: "Settings",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    aliases: ["premium", "mypremium"],
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const record = await PremiumModel.findOne({ guildId: guild.id }).lean();
        const tier = record?.tier ?? "none";
        if (tier === "none") {
            await ctx.reply({ embeds: [infoEmbed(`**${guild.name}** is on the **Free** plan.\n\nType \`premiuminfo\` to see available plans and pricing. Use \`premiumactivate [code]\` to unlock premium features.`)] });
            return;
        }
        const activatedAt = record?.activatedAt ?? null;
        const embed = baseEmbed("premium")
            .setTitle("⭐ Premium Status")
            .addFields({ name: "Plan", value: TIER_LABELS[tier] ?? tier, inline: true }, { name: "Server", value: guild.name, inline: true }, { name: "Activated", value: activatedAt ? `<t:${Math.floor(activatedAt.getTime() / 1000)}:D>` : "Unknown", inline: true }, { name: "Expires", value: "Never (Permanent)", inline: true })
            .setFooter({ text: "Premium is permanent — no monthly fees, no expiry." });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=premiumstatus.js.map