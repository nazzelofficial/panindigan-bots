import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
const SOCIAL_KEYS = ["website", "facebook", "twitter", "instagram", "youtube", "tiktok", "twitch", "github", "discord"];
const command = {
    name: "socials",
    description: "View or set server social media links",
    category: "Utility",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("view").setDescription("View all server social links"))
        .addSubcommand((s) => s.setName("set").setDescription("Set a social media link (Admin only)")
        .addStringOption((o) => o.setName("platform").setDescription("Platform").setRequired(true)
        .addChoices(...SOCIAL_KEYS.map((k) => ({ name: k, value: k }))))
        .addStringOption((o) => o.setName("url").setDescription("URL (leave empty to clear)").setRequired(false).setMaxLength(200))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "view");
        if (sub === "set") {
            const platform = ctx.isSlash ? ctx.interaction.options.getString("platform", true) : ctx.args[1]?.toLowerCase();
            const url = ctx.isSlash ? (ctx.interaction.options.getString("url") ?? null) : (ctx.args[2] ?? null);
            if (!platform || !SOCIAL_KEYS.includes(platform)) {
                await ctx.reply({ embeds: [errorEmbed(`Invalid platform. Choose from: ${SOCIAL_KEYS.join(", ")}`)] });
                return;
            }
            if (url) {
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { [`socials.${platform}`]: url } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed(`**${platform}** link set to: ${url}`)] });
            }
            else {
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { [`socials.${platform}`]: "" } });
                await ctx.reply({ embeds: [successEmbed(`**${platform}** link cleared.`)] });
            }
        }
        else {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const socials = cfg?.socials ?? {};
            const fields = Object.entries(socials).filter(([, v]) => v).map(([k, v]) => `**${k}:** ${v}`);
            const embed = baseEmbed("primary").setTitle(`🌐 ${guild.name} — Social Links`).setDescription(fields.length ? fields.join("\n") : "No social links configured.").setThumbnail(guild.iconURL());
            await ctx.reply({ embeds: [embed] });
        }
    },
};
export default command;
//# sourceMappingURL=socials.js.map