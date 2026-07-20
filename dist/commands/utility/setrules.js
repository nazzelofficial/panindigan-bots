import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "setrules",
    description: "Configure server rules that the bot displays on request",
    category: "Utility",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["rules", "serverrules"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("set").setDescription("Set rules channel at rules content")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel kung saan ilalagay ang rules").setRequired(false))
        .addStringOption((o) => o.setName("rules").setDescription("Rules text (markdown supported, max 3000 chars)").setRequired(false).setMaxLength(3000)))
        .addSubcommand((s) => s.setName("view").setDescription("View current server rules"))
        .addSubcommand((s) => s.setName("post").setDescription("Post the rules to the configured rules channel")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "view");
        if (sub === "view") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const rulesText = cfg?.rulesText ?? "";
            const rulesChannelId = cfg?.rulesChannelId ?? null;
            if (!rulesText && !rulesChannelId) {
                await ctx.reply({ embeds: [baseEmbed("primary").setTitle("📋 Server Rules").setDescription("No rules configured yet. Use `/setrules set` to add rules.")] });
                return;
            }
            const embed = baseEmbed("primary")
                .setTitle(`📋 ${guild.name} — Server Rules`)
                .setDescription(rulesText || "*(No rules text set — rules channel only mode)*");
            if (rulesChannelId)
                embed.addFields({ name: "Rules Channel", value: `<#${rulesChannelId}>`, inline: true });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        if (sub === "set") {
            const chOpt = ctx.isSlash ? ctx.interaction.options.getChannel("channel") : null;
            const chId = chOpt?.id ?? null;
            const rulesText = ctx.isSlash ? ctx.interaction.options.getString("rules") : ctx.args.slice(1).join(" ");
            const update = {};
            if (chId)
                update.rulesChannelId = chId;
            if (rulesText)
                update.rulesText = rulesText;
            if (!Object.keys(update).length) {
                await ctx.reply({ embeds: [errorEmbed("Provide a channel at/o rules text.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: update }, { upsert: true });
            const parts = [chId ? `Rules channel: <#${chId}>` : null, rulesText ? "Rules text updated" : null].filter(Boolean);
            await ctx.reply({ embeds: [successEmbed(`✅ Rules settings updated:\n${parts.join("\n")}`)] });
            return;
        }
        if (sub === "post") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const rulesText = cfg?.rulesText ?? "";
            const rulesChannelId = cfg?.rulesChannelId ?? null;
            if (!rulesChannelId) {
                await ctx.reply({ embeds: [errorEmbed("Walang configured na rules channel. Use `/setrules set channel:#channel`.")] });
                return;
            }
            if (!rulesText) {
                await ctx.reply({ embeds: [errorEmbed("No rules text configured. Use `/setrules set rules:...`.")] });
                return;
            }
            const ch = guild.channels.cache.get(rulesChannelId);
            if (!ch || !ch.send) {
                await ctx.reply({ embeds: [errorEmbed("Rules channel not found or invalid.")] });
                return;
            }
            const embed = baseEmbed("primary")
                .setTitle(`📋 ${guild.name} — Server Rules`)
                .setDescription(rulesText)
                .setFooter({ text: `Last updated by ${ctx.isSlash ? ctx.interaction.user.username : ctx.message.author.username}` });
            await ch.send({ embeds: [embed] });
            await ctx.reply({ embeds: [successEmbed(`✅ Rules posted in <#${rulesChannelId}>.`)] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Gamitin ang: set | view | post")] });
    },
};
export default command;
//# sourceMappingURL=setrules.js.map