import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "antilink",
    description: "Configure anti-link protection — block external URLs posted by regular members",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["automodlink"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("on")
        .setDescription("Enable anti-link protection"))
        .addSubcommand((s) => s
        .setName("off")
        .setDescription("Disable anti-link protection"))
        .addSubcommand((s) => s
        .setName("whitelist")
        .setDescription("Manage whitelisted domains")
        .addStringOption((o) => o
        .setName("action")
        .setDescription("Action to perform")
        .setRequired(true)
        .addChoices({ name: "add", value: "add" }, { name: "remove", value: "remove" }, { name: "list", value: "list" }))
        .addStringOption((o) => o.setName("domain").setDescription("Domain to whitelist (e.g. youtube.com)").setRequired(false)))
        .addSubcommand((s) => s.setName("status").setDescription("View current anti-link configuration")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "on" || sub === "off") {
            const enabled = sub === "on";
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "automod.antiLink": enabled, "automod.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Anti-link protection **${enabled ? "enabled" : "disabled"}**.`)] });
            return;
        }
        if (sub === "whitelist") {
            const action = ctx.isSlash
                ? ctx.interaction.options.getString("action", true)
                : ctx.args[1]?.toLowerCase();
            const domain = ctx.isSlash
                ? ctx.interaction.options.getString("domain")?.toLowerCase().replace(/^https?:\/\//, "").split("/")[0]
                : ctx.args[2]?.toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
            if (action === "add") {
                if (!domain) {
                    await ctx.reply({ embeds: [errorEmbed("Please provide a domain to whitelist.")] });
                    return;
                }
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { "automod.linkWhitelistDomains": domain } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed(`**${domain}** added to the link whitelist.`)] });
            }
            else if (action === "remove") {
                if (!domain) {
                    await ctx.reply({ embeds: [errorEmbed("Please provide a domain to remove.")] });
                    return;
                }
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { "automod.linkWhitelistDomains": domain } });
                await ctx.reply({ embeds: [successEmbed(`**${domain}** removed from the link whitelist.`)] });
            }
            else if (action === "list") {
                const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
                const domains = cfg?.automod?.linkWhitelistDomains ?? [];
                const embed = baseEmbed("primary")
                    .setTitle("🔗 Whitelisted Domains")
                    .setDescription(domains.length ? domains.map((d) => `• \`${d}\``).join("\n") : "No domains whitelisted.");
                await ctx.reply({ embeds: [embed] });
            }
            return;
        }
        if (sub === "status") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const am = cfg?.automod ?? {};
            const embed = baseEmbed("primary")
                .setTitle("🔗 Anti-Link Status")
                .addFields({ name: "Status", value: am.antiLink ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "Also blocks invites", value: am.antiInvite ? "✅ Yes" : "❌ No", inline: true }, { name: "Whitelisted domains", value: (am.linkWhitelistDomains ?? []).length.toString(), inline: true });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Use: on | off | whitelist | status")] });
    },
};
export default command;
//# sourceMappingURL=automodAntilink.js.map