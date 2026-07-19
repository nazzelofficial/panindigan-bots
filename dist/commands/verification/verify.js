import { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds";
function randomCode(len = 6) {
    return Math.random().toString(36).substring(2, 2 + len).toUpperCase();
}
// Per-guild captcha challenges: guildId -> Map<userId, { code, expires }>
const challenges = new Map();
const command = {
    name: "verify",
    description: "Verification system — setup, configure method, manage members",
    category: "Verification",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("setup")
        .setDescription("Set up the verification system")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to post the verify button").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role to grant on verification").setRequired(true)))
        .addSubcommand((s) => s
        .setName("method")
        .setDescription("Set verification method")
        .addStringOption((o) => o
        .setName("type")
        .setDescription("Method type")
        .setRequired(true)
        .addChoices({ name: "button", value: "button" }, { name: "captcha", value: "captcha" })))
        .addSubcommand((s) => s
        .setName("kick")
        .setDescription("Kick all unverified members")
        .addIntegerOption((o) => o.setName("days").setDescription("Members who joined more than N days ago (default: all)").setRequired(false).setMinValue(1)))
        .addSubcommand((s) => s
        .setName("list")
        .setDescription("List unverified members (those without the verified role)"))
        .addSubcommand((s) => s.setName("toggle").setDescription("Enable or disable verification")),
    registerComponents(client) {
        // Handle button verification click
        client.componentHandlers.set("verify", async (interaction) => {
            if (!interaction.isButton())
                return;
            const guild = interaction.guild;
            if (!guild)
                return;
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const vCfg = cfg?.verification ?? {};
            if (!vCfg.enabled) {
                await interaction.reply({ content: "Verification is not enabled in this server.", ephemeral: true });
                return;
            }
            const roleId = vCfg.roleId;
            if (!roleId) {
                await interaction.reply({ content: "Verification role not configured. Contact an admin.", ephemeral: true });
                return;
            }
            const member = interaction.member;
            if (member.roles.cache.has(roleId)) {
                await interaction.reply({ content: "✅ You are already verified!", ephemeral: true });
                return;
            }
            const method = vCfg.method ?? "button";
            if (method === "button") {
                // Instant button verification
                await member.roles.add(roleId, "Verified via button").catch(() => { });
                await interaction.reply({ content: "✅ You have been verified!", ephemeral: true });
            }
            else if (method === "captcha") {
                // Generate a captcha code
                const code = randomCode(6);
                if (!challenges.has(guild.id))
                    challenges.set(guild.id, new Map());
                challenges.get(guild.id).set(member.id, { code, expires: Date.now() + 5 * 60_000 });
                const modal = new ModalBuilder()
                    .setCustomId("verify:captcha")
                    .setTitle("Verification")
                    .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
                    .setCustomId("code")
                    .setLabel(`Enter this code: ${code}`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(6)
                    .setMaxLength(6)));
                await interaction.showModal(modal);
            }
        });
        // Handle captcha modal submission
        client.componentHandlers.set("verify:captcha", async (interaction) => {
            if (!interaction.isModalSubmit())
                return;
            const guild = interaction.guild;
            if (!guild)
                return;
            const entered = interaction.fields.getTextInputValue("code").toUpperCase().trim();
            const guildChallenges = challenges.get(guild.id);
            const challenge = guildChallenges?.get(interaction.user.id);
            if (!challenge || Date.now() > challenge.expires) {
                guildChallenges?.delete(interaction.user.id);
                await interaction.reply({ content: "❌ Your verification code has expired. Click the Verify button again.", ephemeral: true });
                return;
            }
            if (entered !== challenge.code) {
                await interaction.reply({ content: `❌ Incorrect code. Try again. (Expected: ${challenge.code})`, ephemeral: true });
                return;
            }
            guildChallenges.delete(interaction.user.id);
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const roleId = cfg?.verification?.roleId;
            if (!roleId) {
                await interaction.reply({ content: "Verification role not configured.", ephemeral: true });
                return;
            }
            await interaction.member.roles.add(roleId, "Verified via captcha").catch(() => { });
            await interaction.reply({ content: "✅ Captcha passed! You are now verified.", ephemeral: true });
        });
    },
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "setup") {
            const member = ctx.interaction?.member ?? ctx.message?.member;
            if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
                await ctx.reply({ embeds: [errorEmbed("You need Manage Server permission.")] });
                return;
            }
            const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : guild.channels.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[2]?.replace(/\D/g, "") ?? "");
            if (!channel?.isTextBased?.() || !role) {
                await ctx.reply({ embeds: [errorEmbed("Provide a valid text channel and role.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "verification.enabled": true, "verification.channelId": channel.id, "verification.roleId": role.id, "verification.method": "button" } }, { upsert: true });
            const embed = baseEmbed("primary")
                .setTitle("✅ Member Verification")
                .setDescription("Click the button below to verify yourself and gain access to the server.");
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
                .setCustomId("verify:click")
                .setLabel("✅ Verify Me")
                .setStyle(ButtonStyle.Success));
            await channel.send({ embeds: [embed], components: [row] });
            await ctx.reply({ embeds: [successEmbed(`Verification set up in ${channel}. Role: ${role}.`)] });
        }
        else if (sub === "method") {
            const type = ctx.isSlash ? ctx.interaction.options.getString("type", true) : ctx.args[1];
            if (!["button", "captcha"].includes(type)) {
                await ctx.reply({ embeds: [errorEmbed("Method must be: button | captcha")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "verification.method": type } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Verification method set to **${type}**.`)] });
        }
        else if (sub === "toggle") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const current = cfg?.verification?.enabled ?? false;
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "verification.enabled": !current } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Verification is now **${!current ? "enabled" : "disabled"}**.`)] });
        }
        else if (sub === "list") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const roleId = cfg?.verification?.roleId;
            if (!roleId) {
                await ctx.reply({ embeds: [errorEmbed("No verification role configured.")] });
                return;
            }
            const members = await guild.members.fetch();
            const unverified = members.filter((m) => !m.user.bot && !m.roles.cache.has(roleId));
            await ctx.reply({ embeds: [infoEmbed(`**${unverified.size}** unverified members.\n${unverified.first(15)?.map((m) => m.user.tag).join(", ") ?? ""}${unverified.size > 15 ? "…" : ""}`)] });
        }
        else if (sub === "kick") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const roleId = cfg?.verification?.roleId;
            if (!roleId) {
                await ctx.reply({ embeds: [errorEmbed("No verification role configured.")] });
                return;
            }
            const days = ctx.isSlash ? ctx.interaction.options.getInteger("days") ?? 0 : parseInt(ctx.args[1] ?? "0", 10);
            const cutoff = days > 0 ? Date.now() - days * 86_400_000 : 0;
            const members = await guild.members.fetch();
            const toKick = members.filter((m) => !m.user.bot && !m.roles.cache.has(roleId) && (cutoff === 0 || m.joinedTimestamp < cutoff));
            let kicked = 0;
            for (const [, m] of toKick) {
                await m.kick("Kicked for not verifying").catch(() => { });
                kicked++;
            }
            await ctx.reply({ embeds: [successEmbed(`Kicked **${kicked}** unverified member(s).`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: setup | method | toggle | list | kick")] });
        }
    },
};
export default command;
//# sourceMappingURL=verify.js.map