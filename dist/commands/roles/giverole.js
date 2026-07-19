import { PermissionFlagsBits } from "discord.js";
import { TempRoleModel } from "@/database/models/Community";
import { successEmbed, errorEmbed } from "@/utils/embeds";
function parseDuration(str) {
    const match = str.match(/^(\d+)(s|m|h|d)$/i);
    if (!match)
        return null;
    const n = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === "s")
        return n * 1000;
    if (unit === "m")
        return n * 60_000;
    if (unit === "h")
        return n * 3_600_000;
    if (unit === "d")
        return n * 86_400_000;
    return null;
}
const command = {
    name: "giverole",
    description: "Give a member a role temporarily (auto-removed after the duration expires)",
    category: "Roles",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    botPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    aliases: ["temprole", "temporaryrole"],
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("Member to give the role to").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role to assign temporarily").setRequired(true))
        .addStringOption((o) => o.setName("duration").setDescription("Duration (e.g. 10m, 2h, 1d). Leave blank for permanent assignment.").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetUser = ctx.isSlash
            ? ctx.interaction.options.getUser("user", true)
            : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, "") ?? "").catch(() => null);
        const role = ctx.isSlash
            ? ctx.interaction.options.getRole("role", true)
            : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
        const durationStr = ctx.isSlash ? ctx.interaction.options.getString("duration") : ctx.args[2];
        if (!targetUser) {
            await ctx.reply({ embeds: [errorEmbed("User not found.")] });
            return;
        }
        if (!role) {
            await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
            return;
        }
        const member = await guild.members.fetch(targetUser.id).catch(() => null);
        if (!member) {
            await ctx.reply({ embeds: [errorEmbed("Member not found in this server.")] });
            return;
        }
        const botMember = guild.members.me;
        if (botMember && guild.roles.cache.get(role.id).position >= botMember.roles.highest.position) {
            await ctx.reply({ embeds: [errorEmbed("I can't assign a role higher than or equal to my highest role.")] });
            return;
        }
        await member.roles.add(role.id, `Temp role by ${ctx.userId}`).catch(() => { });
        let msg = `✅ Gave ${role} to **${targetUser.username}**.`;
        if (durationStr) {
            const ms = parseDuration(durationStr);
            if (!ms || ms < 5_000) {
                await ctx.reply({ embeds: [errorEmbed("Invalid duration. Examples: `10m`, `2h`, `1d`. Minimum: 5s.")] });
                return;
            }
            const expiresAt = new Date(Date.now() + ms);
            await TempRoleModel.create({
                guildId: guild.id,
                userId: targetUser.id,
                roleId: role.id,
                expiresAt,
                assignedBy: ctx.userId,
            });
            msg += ` Role will be automatically removed <t:${Math.floor(expiresAt.getTime() / 1000)}:R>.`;
        }
        else {
            msg += " No duration set — role is permanent until manually removed.";
        }
        await ctx.reply({ embeds: [successEmbed(msg)] });
    },
};
export default command;
//# sourceMappingURL=giverole.js.map