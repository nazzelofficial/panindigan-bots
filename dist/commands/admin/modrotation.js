import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "modrotation",
    description: "Set up and view the rotating moderation shift schedule for staff",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    aliases: ["modschedule", "staffrotation"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("setup")
        .setDescription("Configure the moderation rotation schedule")
        .addStringOption((o) => o.setName("schedule").setDescription("Schedule format: 'user1,user2,user3' cycled daily/weekly").setRequired(true))
        .addStringOption((o) => o.setName("interval").setDescription("Rotation interval").setRequired(false)
        .addChoices({ name: "Daily", value: "daily" }, { name: "Weekly", value: "weekly" }, { name: "Bi-Weekly", value: "biweekly" }))
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to post rotation announcements").setRequired(false)))
        .addSubcommand((s) => s.setName("view").setDescription("View the current moderation rotation schedule"))
        .addSubcommand((s) => s.setName("disable").setDescription("Disable the moderation rotation")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "view";
        if (sub === "setup") {
            const schedule = ctx.isSlash ? ctx.interaction.options.getString("schedule", true) : ctx.args.slice(1).join(" ");
            const interval = ctx.isSlash ? (ctx.interaction.options.getString("interval") ?? "weekly") : "weekly";
            const channel = ctx.isSlash ? ctx.interaction.options.getChannel("channel") : null;
            if (!schedule) {
                await ctx.reply({ embeds: [errorEmbed("Provide a schedule (comma-separated user mentions or IDs).")] });
                return;
            }
            // Parse user IDs from mentions or raw IDs
            const userIds = schedule.split(",").map((s) => s.replace(/\D/g, "").trim()).filter(Boolean);
            if (userIds.length < 2) {
                await ctx.reply({ embeds: [errorEmbed("Provide at least 2 moderators in the rotation.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, {
                $set: {
                    "modRotation.enabled": true,
                    "modRotation.userIds": userIds,
                    "modRotation.interval": interval,
                    "modRotation.channelId": channel?.id ?? null,
                    "modRotation.currentIndex": 0,
                    "modRotation.lastRotationAt": new Date(),
                },
            }, { upsert: true });
            const userMentions = userIds.map((id) => `<@${id}>`).join(" → ");
            await ctx.reply({
                embeds: [
                    successEmbed(`Moderation rotation configured!\n\n**Schedule (${interval}):** ${userMentions}\n${channel ? `**Announcements:** ${channel}` : "No announcement channel set."}\n\nRotation will cycle through these moderators ${interval}.`),
                ],
            });
        }
        else if (sub === "view") {
            const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
            const rotation = doc?.modRotation;
            if (!rotation?.enabled || !rotation.userIds?.length) {
                await ctx.reply({ embeds: [infoEmbed("No moderation rotation configured. Use `/modrotation setup` to set one up.")] });
                return;
            }
            const currentMod = rotation.userIds[rotation.currentIndex % rotation.userIds.length];
            const embed = baseEmbed("primary")
                .setTitle("📅 Moderation Rotation Schedule")
                .addFields({ name: "Current On-Duty", value: `<@${currentMod}>`, inline: true }, { name: "Interval", value: rotation.interval ?? "weekly", inline: true }, { name: "Rotation Order", value: rotation.userIds.map((id, i) => `${i + 1}. <@${id}>${i === rotation.currentIndex % rotation.userIds.length ? " 👈 current" : ""}`).join("\n"), inline: false });
            if (rotation.channelId)
                embed.addFields({ name: "Announcement Channel", value: `<#${rotation.channelId}>`, inline: true });
            if (rotation.lastRotationAt)
                embed.addFields({ name: "Last Rotated", value: `<t:${Math.floor(new Date(rotation.lastRotationAt).getTime() / 1000)}:R>`, inline: true });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "disable") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "modRotation.enabled": false } });
            await ctx.reply({ embeds: [successEmbed("Moderation rotation disabled.")] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: setup | view | disable")] });
        }
    },
};
export default command;
//# sourceMappingURL=modrotation.js.map