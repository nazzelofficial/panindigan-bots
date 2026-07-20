import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
// Schema field names (camelCase) → display label
// Only features that exist in the AutoModSchema are listed here.
const FEATURE_MAP = {
    antispam: { field: "antiSpam", label: "Anti-Spam", premium: true },
    antiraid: { field: "antiRaid", label: "Anti-Raid", premium: true },
    antilink: { field: "antiLink", label: "Anti-Link" },
    antiinvite: { field: "antiInvite", label: "Anti-Invite" },
    antinsfw: { field: "antiNsfw", label: "Anti-NSFW (AI)", premium: true },
    antiscam: { field: "antiScam", label: "Anti-Scam (AI)", premium: true },
    antitoxicity: { field: "antiToxicity", label: "Anti-Toxicity (AI)", premium: true },
    antialt: { field: "antiAlt", label: "Anti-Alt Accounts", premium: true },
    antibot: { field: "antiBot", label: "Anti-Unauthorized Bots" },
    antiflood: { field: "antiFlood", label: "Anti-Message Flood" },
    antimassjoin: { field: "antiMassJoin", label: "Anti-Mass Join", premium: true },
    antighostping: { field: "antiGhostPing", label: "Anti-Ghost Ping" },
    anticaps: { field: "antiCaps", label: "Anti-Caps" },
};
const command = {
    name: "automod",
    description: "Configure automod protections — toggle features, manage whitelist, bad words, and view status",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("enable").setDescription("Enable an automod protection feature")
        .addStringOption((o) => o.setName("feature").setDescription("Feature to enable").setRequired(true)
        .addChoices(...Object.entries(FEATURE_MAP).map(([v, { label }]) => ({ name: label, value: v })))))
        .addSubcommand((s) => s.setName("disable").setDescription("Disable an automod protection feature")
        .addStringOption((o) => o.setName("feature").setDescription("Feature to disable").setRequired(true)
        .addChoices(...Object.entries(FEATURE_MAP).map(([v, { label }]) => ({ name: label, value: v })))))
        .addSubcommand((s) => s.setName("status").setDescription("View all automod feature statuses"))
        .addSubcommand((s) => s.setName("config").setDescription("View the full automod configuration (alias for status)"))
        .addSubcommand((s) => s.setName("whitelist").setDescription("Add, remove, or list automod whitelist entries")
        .addStringOption((o) => o.setName("action").setDescription("Action to perform").setRequired(true)
        .addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" }, { name: "List", value: "list" }))
        .addStringOption((o) => o.setName("type").setDescription("Type of exemption").setRequired(false)
        .addChoices({ name: "User", value: "user" }, { name: "Role", value: "role" }, { name: "Channel", value: "channel" }))
        .addStringOption((o) => o.setName("id").setDescription("ID of the user, role, or channel to exempt").setRequired(false)))
        .addSubcommand((s) => s.setName("badword").setDescription("Add or remove a word from the bad-word filter")
        .addStringOption((o) => o.setName("action").setDescription("add or remove").setRequired(true)
        .addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" }))
        .addStringOption((o) => o.setName("word").setDescription("Word to add or remove").setRequired(true)))
        .addSubcommand((s) => s.setName("badwords").setDescription("View all filtered words (shown hidden for safety)"))
        .addSubcommand((s) => s.setName("antimention").setDescription("Set the maximum number of user mentions allowed per message (0 = disable)")
        .addIntegerOption((o) => o.setName("count").setDescription("Max mentions (0 = disabled, 2–50)").setRequired(true).setMinValue(0).setMaxValue(50)))
        // Direct toggle subcommands — map to schema fields
        .addSubcommand((s) => s.setName("antispam").setDescription("Toggle anti-spam protection ⭐")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antiraid").setDescription("Toggle anti-raid protection ⭐")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antilink").setDescription("Toggle anti-link protection")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antiinvite").setDescription("Toggle blocking of Discord invite links")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antinsfw").setDescription("Toggle AI-powered NSFW content detection ⭐")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antiscam").setDescription("Toggle AI-powered scam/phishing link detection ⭐")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antitoxicity").setDescription("Toggle AI-powered toxicity message filter ⭐")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antialt").setDescription("Toggle blocking of alt/new accounts from joining ⭐")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antibot").setDescription("Toggle blocking of unauthorized bot additions")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antiflood").setDescription("Toggle anti-message-flood protection")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antimassjoin").setDescription("Toggle mass-join raid detection ⭐")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("antighostping").setDescription("Toggle detection and logging of ghost pings")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("anticaps").setDescription("Toggle anti-caps filter")
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        // ── Direct-toggle subcommands ───────────────────────────────────────────
        if (FEATURE_MAP[sub]) {
            const { field, label, premium } = FEATURE_MAP[sub];
            const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[1] === "on";
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { [`automod.${field}`]: enabled, "automod.enabled": true } }, { upsert: true });
            await ctx.reply({
                embeds: [successEmbed(`${premium ? "⭐ " : ""}**${label}** has been **${enabled ? "enabled" : "disabled"}**.`)],
            });
            return;
        }
        // ── enable / disable (generic, feature-picker) ─────────────────────────
        if (sub === "enable" || sub === "disable") {
            const key = ctx.isSlash ? ctx.interaction.options.getString("feature", true) : ctx.args[1]?.toLowerCase();
            const feature = FEATURE_MAP[key ?? ""];
            if (!feature) {
                await ctx.reply({ embeds: [errorEmbed("Invalid feature. Use `/automod status` to see available features.")] });
                return;
            }
            const enabled = sub === "enable";
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { [`automod.${feature.field}`]: enabled, "automod.enabled": true } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`**${feature.label}** has been **${enabled ? "enabled" : "disabled"}**.`)] });
            return;
        }
        // ── antimention ────────────────────────────────────────────────────────
        if (sub === "antimention") {
            const count = ctx.isSlash ? ctx.interaction.options.getInteger("count", true) : parseInt(ctx.args[1] ?? "0");
            if (isNaN(count)) {
                await ctx.reply({ embeds: [errorEmbed("Provide a valid number (0 to disable).")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "automod.antiMentionLimit": count, "automod.enabled": true } }, { upsert: true });
            await ctx.reply({
                embeds: [
                    count === 0
                        ? successEmbed("Anti-mention protection **disabled**.")
                        : successEmbed(`Anti-mention protection **enabled** — max **${count}** user mentions per message.`),
                ],
            });
            return;
        }
        // ── status / config ────────────────────────────────────────────────────
        if (sub === "status" || sub === "config") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const am = cfg?.automod ?? {};
            const on = "🟢";
            const off = "🔴";
            const fmt = (v) => (v ? on : off);
            const embed = baseEmbed("primary")
                .setTitle("🛡️ Automod Configuration")
                .setDescription(`Global automod: ${am.enabled ? `${on} Enabled` : `${off} Disabled`}`)
                .addFields({ name: "🔗 Anti-Link", value: fmt(am.antiLink), inline: true }, { name: "📨 Anti-Invite", value: fmt(am.antiInvite), inline: true }, { name: "⚡ Anti-Spam ⭐", value: fmt(am.antiSpam), inline: true }, { name: "🚨 Anti-Raid ⭐", value: fmt(am.antiRaid), inline: true }, { name: "🔠 Anti-Caps", value: fmt(am.antiCaps), inline: true }, { name: "🔞 Anti-NSFW (AI) ⭐", value: fmt(am.antiNsfw), inline: true }, { name: "🎣 Anti-Scam (AI) ⭐", value: fmt(am.antiScam), inline: true }, { name: "☠️ Anti-Toxicity ⭐", value: fmt(am.antiToxicity), inline: true }, { name: "👤 Anti-Alt ⭐", value: fmt(am.antiAlt), inline: true }, { name: "🤖 Anti-Bot", value: fmt(am.antiBot), inline: true }, { name: "💬 Anti-Flood", value: fmt(am.antiFlood), inline: true }, { name: "👥 Anti-Mass Join ⭐", value: fmt(am.antiMassJoin), inline: true }, { name: "👻 Anti-Ghost Ping", value: fmt(am.antiGhostPing), inline: true }, { name: "📣 Anti-Mention",
                value: am.antiMentionLimit > 0 ? `${on} (max ${am.antiMentionLimit})` : off, inline: true }, { name: "🚫 Bad-Word Filter",
                value: (am.badWords?.length ?? 0) > 0 ? `${on} (${am.badWords.length} words)` : off, inline: true });
            const domains = am.linkWhitelistDomains ?? [];
            if (domains.length)
                embed.addFields({ name: "Whitelisted Domains", value: domains.join(", "), inline: false });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        // ── whitelist ──────────────────────────────────────────────────────────
        if (sub === "whitelist") {
            const action = ctx.isSlash ? ctx.interaction.options.getString("action", true) : ctx.args[1]?.toLowerCase();
            const type = ctx.isSlash ? ctx.interaction.options.getString("type") : ctx.args[2]?.toLowerCase();
            const id = ctx.isSlash ? ctx.interaction.options.getString("id") : ctx.args[3]?.replace(/\D/g, "");
            if (action === "list") {
                const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
                const am = cfg?.automod ?? {};
                const embed = baseEmbed("primary")
                    .setTitle("🛡️ Automod Whitelist")
                    .addFields({ name: "Users", value: (am.whitelistUsers ?? []).map((i) => `<@${i}>`).join(", ") || "None", inline: false }, { name: "Roles", value: (am.whitelistRoles ?? []).map((i) => `<@&${i}>`).join(", ") || "None", inline: false }, { name: "Channels", value: (am.whitelistChannels ?? []).map((i) => `<#${i}>`).join(", ") || "None", inline: false });
                await ctx.reply({ embeds: [embed] });
                return;
            }
            // add / remove
            const fieldMap = { user: "whitelistUsers", role: "whitelistRoles", channel: "whitelistChannels" };
            if (!type || !fieldMap[type] || !id) {
                await ctx.reply({ embeds: [errorEmbed("Provide a type (user/role/channel) and ID.")] });
                return;
            }
            const op = action === "add" ? "$addToSet" : "$pull";
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { [op]: { [`automod.${fieldMap[type]}`]: id } }, { upsert: true });
            const mention = type === "user" ? `<@${id}>` : type === "role" ? `<@&${id}>` : `<#${id}>`;
            await ctx.reply({ embeds: [successEmbed(`${mention} has been **${action === "add" ? "added to" : "removed from"}** the automod ${type} whitelist.`)] });
            return;
        }
        // ── badword / badwords ─────────────────────────────────────────────────
        if (sub === "badword") {
            const action = ctx.isSlash ? ctx.interaction.options.getString("action", true) : ctx.args[1]?.toLowerCase();
            const word = ctx.isSlash ? ctx.interaction.options.getString("word", true) : ctx.args[2];
            if (!word) {
                await ctx.reply({ embeds: [errorEmbed("Provide a word to add or remove.")] });
                return;
            }
            const op = action === "add" ? "$addToSet" : "$pull";
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { [op]: { "automod.badWords": word.toLowerCase() } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Word has been **${action === "add" ? "added to" : "removed from"}** the bad-word filter.`)] });
            return;
        }
        if (sub === "badwords") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const words = cfg?.automod?.badWords ?? [];
            if (!words.length) {
                await ctx.reply({ embeds: [baseEmbed("info").setTitle("🚫 Bad-Word Filter").setDescription("No filtered words configured.")] });
                return;
            }
            const display = words.map((w) => `||\`${w}\`||`).join(", ");
            await ctx.reply({
                embeds: [
                    baseEmbed("warning")
                        .setTitle("🚫 Bad-Word Filter")
                        .setDescription(display.length > 3800 ? display.slice(0, 3800) + "…" : display)
                        .setFooter({ text: `${words.length} word${words.length !== 1 ? "s" : ""} filtered` }),
                ],
                ephemeral: true,
            });
            return;
        }
        await ctx.reply({
            embeds: [errorEmbed("Unknown subcommand. Use: enable | disable | status | config | whitelist | badword | badwords | antimention | " +
                    "antispam | antiraid | antilink | antiinvite | antinsfw | antiscam | antitoxicity | antialt | " +
                    "antibot | antiflood | antimassjoin | antighostping | anticaps")],
        });
    },
};
export default command;
//# sourceMappingURL=automod.js.map