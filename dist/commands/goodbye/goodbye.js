import { PermissionFlagsBits, AttachmentBuilder } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, successEmbed, errorEmbed } from "../../utils/embeds.js";
function fillTemplate(template, replacements) {
    return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? `{${key}}`);
}
const command = {
    name: "goodbye",
    description: "Configure the goodbye message system",
    category: "Goodbye",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("setup")
        .setDescription("Set up goodbye messages")
        .addChannelOption((o) => o.setName("channel").setDescription("Goodbye channel").setRequired(true))
        .addStringOption((o) => o.setName("message").setDescription("Message (use {user}, {server}, {membercount})").setRequired(false)))
        .addSubcommand((s) => s.setName("test").setDescription("Test the goodbye message with your account"))
        .addSubcommand((s) => s.setName("disable").setDescription("Disable goodbye messages"))
        .addSubcommand((s) => s
        .setName("message")
        .setDescription("Update the goodbye message text")
        .addStringOption((o) => o.setName("text").setDescription("New message (use {user}, {server}, {membercount})").setRequired(true)))
        .addSubcommand((s) => s.setName("card").setDescription("Enable/disable graphical goodbye cards (Premium)").addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "setup") {
            const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : guild.channels.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            const msg = ctx.isSlash ? ctx.interaction.options.getString("message") ?? "{user} has left {server}. We now have {memberCount} members." : ctx.args.slice(2).join(" ") || "{user} has left {server}. We now have {memberCount} members.";
            if (!channel?.isTextBased?.()) {
                await ctx.reply({ embeds: [errorEmbed("Provide a valid text channel.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "goodbye.enabled": true, "goodbye.channelId": channel.id, "goodbye.message": msg } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Goodbye messages enabled in ${channel}.`)] });
        }
        else if (sub === "message") {
            const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.slice(1).join(" ");
            if (!text) {
                await ctx.reply({ embeds: [errorEmbed("Provide a message.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "goodbye.message": text } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Goodbye message updated:\n> ${text}`)] });
        }
        else if (sub === "disable") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "goodbye.enabled": false } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed("Goodbye messages disabled.")] });
        }
        else if (sub === "test") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const goodbyeCfg = cfg?.goodbye ?? {};
            if (!goodbyeCfg.channelId) {
                await ctx.reply({ embeds: [errorEmbed("Run `goodbye setup` first.")] });
                return;
            }
            const user = await ctx.client.users.fetch(ctx.userId);
            const text = fillTemplate(goodbyeCfg.message ?? "{user} has left {server}.", { user: `<@${ctx.userId}>`, server: guild.name, membercount: String(guild.memberCount), username: user.username });
            const channel = guild.channels.cache.get(goodbyeCfg.channelId);
            if (!channel?.isTextBased()) {
                await ctx.reply({ embeds: [errorEmbed("Configured goodbye channel not found.")] });
                return;
            }
            let imageAttachment = null;
            if (goodbyeCfg.cardEnabled) {
                try {
                    const { createCanvas, loadImage } = await import("@napi-rs/canvas");
                    const W = 700, H = 250;
                    const canvas = createCanvas(W, H);
                    const c = canvas.getContext("2d");
                    const bg = c.createLinearGradient(0, 0, W, H);
                    bg.addColorStop(0, "#ED4245");
                    bg.addColorStop(1, "#991B1B");
                    c.fillStyle = bg;
                    c.beginPath();
                    c.roundRect(0, 0, W, H, 20);
                    c.fill();
                    const avatarUrl = user.displayAvatarURL({ extension: "png", size: 128 });
                    const avatarImg = await loadImage(avatarUrl).catch(() => null);
                    if (avatarImg) {
                        c.save();
                        c.beginPath();
                        c.arc(125, 125, 75, 0, Math.PI * 2);
                        c.clip();
                        c.drawImage(avatarImg, 50, 50, 150, 150);
                        c.restore();
                    }
                    c.fillStyle = "#fff";
                    c.font = "bold 28px Sans";
                    c.fillText(`Goodbye, ${user.username.slice(0, 20)}!`, 240, 100);
                    c.fillStyle = "#a0a0b0";
                    c.font = "18px Sans";
                    c.fillText(`We now have ${guild.memberCount} members`, 240, 140);
                    c.fillStyle = "#c0c0d0";
                    c.font = "16px Sans";
                    c.fillText(guild.name.slice(0, 30), 240, 170);
                    imageAttachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "goodbye.png" });
                }
                catch { /* fallback to text */ }
            }
            const embed = baseEmbed("danger").setDescription(text).setThumbnail(user.displayAvatarURL());
            if (imageAttachment)
                embed.setImage("attachment://goodbye.png");
            await channel.send({ embeds: [embed], files: imageAttachment ? [imageAttachment] : [] });
            await ctx.reply({ embeds: [successEmbed("Test goodbye message sent!")] });
        }
        else if (sub === "card") {
            const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "false";
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "goodbye.cardEnabled": enabled } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Goodbye cards **${enabled ? "enabled" : "disabled"}**.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: setup | message | disable | test | card")] });
        }
    },
};
export default command;
//# sourceMappingURL=goodbye.js.map