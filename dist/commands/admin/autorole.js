import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "autorole",
    description: "Configure roles automatically assigned to new members or bots on join",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    botPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    aliases: ["joinrole"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("add")
        .setDescription("Add a role to auto-assign on member join")
        .addRoleOption((o) => o.setName("role").setDescription("Role to add").setRequired(true))
        .addStringOption((o) => o.setName("type").setDescription("Who gets this role").setRequired(false)
        .addChoices({ name: "members", value: "members" }, { name: "bots", value: "bots" }, { name: "all", value: "all" })))
        .addSubcommand((s) => s
        .setName("remove")
        .setDescription("Remove an auto-role")
        .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)))
        .addSubcommand((s) => s.setName("list").setDescription("List all configured auto-roles"))
        .addSubcommand((s) => s.setName("clear").setDescription("Clear all auto-roles")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "add") {
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            const type = (ctx.isSlash ? ctx.interaction.options.getString("type") : ctx.args[2]) ?? "members";
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            const botMember = guild.members.me;
            if (botMember && guild.roles.cache.get(role.id).position >= botMember.roles.highest.position) {
                await ctx.reply({ embeds: [errorEmbed("That role is higher than or equal to my highest role.")] });
                return;
            }
            if (type === "bots") {
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { autoRoleBotId: role.id } }, { upsert: true });
            }
            else {
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { autoRoleIds: role.id } }, { upsert: true });
            }
            await ctx.reply({ embeds: [successEmbed(`Auto-role added: ${role} will be assigned to **${type}** on join.`)] });
        }
        else if (sub === "remove") {
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { autoRoleIds: role.id }, $set: { autoRoleBotId: null } });
            await ctx.reply({ embeds: [successEmbed(`Auto-role removed: ${role}.`)] });
        }
        else if (sub === "list") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const roles = cfg?.autoRoleIds ?? [];
            const botRole = cfg?.autoRoleBotId;
            if (!roles.length && !botRole) {
                await ctx.reply({ embeds: [infoEmbed("No auto-roles configured.")] });
                return;
            }
            const embed = baseEmbed("primary")
                .setTitle("🎭 Auto-Roles")
                .addFields({ name: "Member Roles", value: roles.length ? roles.map((id) => `<@&${id}>`).join(", ") : "None", inline: false }, { name: "Bot Role", value: botRole ? `<@&${botRole}>` : "None", inline: false });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "clear") {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { autoRoleIds: [], autoRoleBotId: null } });
            await ctx.reply({ embeds: [successEmbed("All auto-roles cleared.")] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: add | remove | list | clear")] });
        }
    },
};
export default command;
//# sourceMappingURL=autorole.js.map