import { PermissionFlagsBits } from "discord.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { GuildModel } from "../../database/models/Guild";
import { PremiumModel, PremiumCodeModel } from "../../database/models/Premium";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds";
import { config } from "../../config/config";
function getLatestChangelogExcerpt() {
    try {
        const changelogPath = path.resolve(process.cwd(), "CHANGELOG.md");
        const content = readFileSync(changelogPath, "utf-8");
        const lines = content.split(/\r?\n/);
        const startIndex = lines.findIndex((line) => line.startsWith("## [0.1.2]"));
        if (startIndex === -1)
            return content.slice(0, 1800);
        const endIndex = lines.findIndex((line, index) => index > startIndex && line.startsWith("## ["));
        const excerptLines = lines.slice(startIndex, endIndex === -1 ? undefined : endIndex);
        return excerptLines.join("\n").slice(0, 1800);
    }
    catch {
        return "Changelog data is currently unavailable.";
    }
}
const command = {
    name: "settings",
    description: "View server settings, bot info, invite, or activate premium",
    category: "Settings",
    access: "general",
    guildOnly: false,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("view").setDescription("View all server settings (Admin)"))
        .addSubcommand((s) => s.setName("premium").setDescription("View premium status for this server"))
        .addSubcommand((s) => s.setName("activate").setDescription("Activate a premium code for this server")
        .addStringOption((o) => o.setName("code").setDescription("Premium code").setRequired(true)))
        .addSubcommand((s) => s.setName("botinfo").setDescription("View bot information"))
        .addSubcommand((s) => s.setName("invite").setDescription("Get the bot invite link"))
        .addSubcommand((s) => s.setName("support").setDescription("Get the support server link"))
        .addSubcommand((s) => s.setName("changelog").setDescription("View the latest changelog"))
        .addSubcommand((s) => s.setName("vote").setDescription("Vote for the bot to support it")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "botinfo";
        if (sub === "view") {
            if (!guild) {
                await ctx.reply({ embeds: [infoEmbed("Use this in a server.")] });
                return;
            }
            const member = ctx.interaction?.member ?? ctx.message?.member;
            if (!member?.permissions?.has(PermissionFlagsBits.ManageGuild)) {
                await ctx.reply({ embeds: [errorEmbed("You need Manage Server permission.")] });
                return;
            }
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const prem = await PremiumModel.findOne({ guildId: guild.id }).lean();
            const embed = baseEmbed("primary")
                .setTitle(`⚙️ Server Settings — ${guild.name}`)
                .addFields({ name: "Prefix", value: `\`${cfg?.prefix ?? config.bot.defaultPrefix}\``, inline: true }, { name: "Premium Tier", value: prem?.tier ?? "free", inline: true }, { name: "Language", value: cfg?.language ?? "en", inline: true }, { name: "Welcome", value: cfg?.welcome?.enabled ? `✅ <#${cfg.welcome.channelId}>` : "❌", inline: true }, { name: "Goodbye", value: cfg?.goodbye?.enabled ? `✅ <#${cfg.goodbye.channelId}>` : "❌", inline: true }, { name: "Verification", value: cfg?.verification?.enabled ? "✅" : "❌", inline: true }, { name: "Anti-Nuke", value: cfg?.antinuke?.enabled ? "✅" : "❌", inline: true }, { name: "Automod", value: cfg?.automod?.enabled ? "✅" : "❌", inline: true }, { name: "Tickets", value: cfg?.tickets?.enabled ? "✅" : "❌", inline: true }, { name: "Leveling", value: cfg?.leveling?.enabled !== false ? "✅" : "❌", inline: true }, { name: "Economy", value: cfg?.economy?.enabled !== false ? "✅" : "❌", inline: true }, { name: "Disabled Commands", value: (cfg?.disabledCommands ?? []).join(", ") || "None", inline: false });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "premium") {
            if (!guild) {
                await ctx.reply({ embeds: [infoEmbed("Use this in a server.")] });
                return;
            }
            const prem = await PremiumModel.findOne({ guildId: guild.id }).lean();
            if (!prem || !prem.active) {
                await ctx.reply({ embeds: [infoEmbed("This server is on the **Free** tier.\n\nActivate premium with `/settings activate <code>` or purchase at the support server.")] });
            }
            else {
                const tierLabel = { basic: "Basic ⭐", standard: "Standard ⭐⭐", gold: "Gold 🥇", enterprise: "Enterprise 🏆" };
                const embed = baseEmbed("warning")
                    .setTitle("⭐ Premium Status")
                    .addFields({ name: "Tier", value: tierLabel[prem.tier] ?? prem.tier, inline: true }, { name: "Active", value: "✅ Yes", inline: true }, { name: "Granted By", value: prem.grantedBy ? `<@${prem.grantedBy}>` : "Code activation", inline: true });
                await ctx.reply({ embeds: [embed] });
            }
        }
        else if (sub === "activate") {
            if (!guild) {
                await ctx.reply({ embeds: [infoEmbed("Use this in a server.")] });
                return;
            }
            const code = ctx.isSlash ? ctx.interaction.options.getString("code", true) : ctx.args[1];
            if (!code) {
                await ctx.reply({ embeds: [errorEmbed("Provide a premium code.")] });
                return;
            }
            const codeDoc = await PremiumCodeModel.findOne({ code: code.toUpperCase().trim(), used: false });
            if (!codeDoc) {
                await ctx.reply({ embeds: [errorEmbed("Invalid or already-used premium code.")] });
                return;
            }
            await PremiumModel.findOneAndUpdate({ guildId: guild.id }, { $set: { tier: codeDoc.tier, active: true, grantedBy: ctx.userId } }, { upsert: true });
            await PremiumCodeModel.findByIdAndUpdate(codeDoc._id, {
                $set: { used: true, usedBy: ctx.userId, usedInGuildId: guild.id, usedAt: new Date() },
            });
            const tierLabel = { basic: "Basic ⭐", standard: "Standard ⭐⭐", gold: "Gold 🥇", enterprise: "Enterprise 🏆" };
            await ctx.reply({ embeds: [successEmbed(`⭐ Premium tier **${tierLabel[codeDoc.tier] ?? codeDoc.tier}** activated for **${guild.name}**! Thank you for your support!`)] });
        }
        else if (sub === "botinfo") {
            const uptime = Math.floor((Date.now() - ctx.client.startedAt) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;
            const version = "0.1.5";
            const embed = baseEmbed("primary")
                .setTitle(`🤖 ${ctx.client.user.username}`)
                .setThumbnail(ctx.client.user.displayAvatarURL())
                .addFields({ name: "Version", value: `v${version}`, inline: true }, { name: "Guilds", value: String(ctx.client.guilds.cache.size), inline: true }, { name: "Commands", value: String(ctx.client.commands.size), inline: true }, { name: "Uptime", value: `${hours}h ${minutes}m ${seconds}s`, inline: true }, { name: "Ping", value: `${ctx.client.ws.ping}ms`, inline: true }, { name: "Node.js", value: process.version, inline: true })
                .setFooter({ text: "Made with ❤️ for Filipino communities" });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "invite") {
            const clientId = process.env.DISCORD_CLIENT_ID ?? ctx.client.user.id;
            const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("📩 Invite Panindigan").setDescription(`[Click here to invite the bot!](${url})`)] });
        }
        else if (sub === "support") {
            const supportUrl = config.bot?.supportServerInvite ?? "https://discord.gg/panindigan";
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🆘 Support Server").setDescription(`Join our support server: ${supportUrl}`)] });
        }
        else if (sub === "changelog") {
            const excerpt = getLatestChangelogExcerpt();
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("📋 Changelog").setDescription(`\`\`\`md\n${excerpt}\n\`\`\``)] });
        }
        else if (sub === "vote") {
            await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🗳️ Vote for Panindigan").setDescription("Your votes help the bot grow! Check the support server for voting links.")] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: view | premium | activate | botinfo | invite | support | changelog | vote")] });
        }
    },
};
export default command;
//# sourceMappingURL=settings.js.map