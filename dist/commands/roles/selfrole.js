import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";
const command = {
    name: "selfrole",
    description: "Manage self-assignable roles that any member can give themselves",
    category: "Roles",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["iam", "iamnot"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("add")
        .setDescription("(Admin) Make a role self-assignable")
        .addRoleOption((o) => o.setName("role").setDescription("Role to make self-assignable").setRequired(true)))
        .addSubcommand((s) => s.setName("remove")
        .setDescription("(Admin) Remove a role from self-assignable list")
        .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)))
        .addSubcommand((s) => s.setName("list").setDescription("List all self-assignable roles"))
        .addSubcommand((s) => s.setName("get")
        .setDescription("Give yourself a self-assignable role")
        .addRoleOption((o) => o.setName("role").setDescription("Role to give yourself").setRequired(true)))
        .addSubcommand((s) => s.setName("drop")
        .setDescription("Remove a self-assignable role from yourself")
        .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        const member = ctx.isSlash
            ? await guild.members.fetch(ctx.userId).catch(() => null)
            : ctx.message?.member ?? null;
        const guildDoc = await GuildModel.findOne({ guildId: guild.id }).lean();
        const selfRoles = guildDoc?.selfRoleIds ?? [];
        if (sub === "add") {
            // Admin-only action
            if (!member?.permissions.has(PermissionFlagsBits.ManageRoles)) {
                await ctx.reply({ embeds: [errorEmbed("You need **Manage Roles** permission to add self-assignable roles.")] });
                return;
            }
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            if (selfRoles.includes(role.id)) {
                await ctx.reply({ embeds: [infoEmbed(`${role} is already self-assignable.`)] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { selfRoleIds: role.id } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`${role} is now self-assignable. Members can use \`/selfrole get\` to get it.`)] });
        }
        else if (sub === "remove") {
            if (!member?.permissions.has(PermissionFlagsBits.ManageRoles)) {
                await ctx.reply({ embeds: [errorEmbed("You need **Manage Roles** permission to remove self-assignable roles.")] });
                return;
            }
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { selfRoleIds: role.id } });
            await ctx.reply({ embeds: [successEmbed(`${role} is no longer self-assignable.`)] });
        }
        else if (sub === "list") {
            if (!selfRoles.length) {
                await ctx.reply({ embeds: [infoEmbed("No self-assignable roles configured. Admins can use `/selfrole add` to add some.")] });
                return;
            }
            const embed = baseEmbed("primary").setTitle("🏷️ Self-Assignable Roles")
                .setDescription(selfRoles.map((id) => `<@&${id}>`).join("\n") || "None")
                .setFooter({ text: "Use /selfrole get [role] to assign yourself a role" });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "get") {
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            if (!selfRoles.includes(role.id)) {
                await ctx.reply({ embeds: [errorEmbed(`${role} is not a self-assignable role. Use \`/selfrole list\` to see available roles.`)] });
                return;
            }
            if (!member) {
                await ctx.reply({ embeds: [errorEmbed("Could not find your server profile.")] });
                return;
            }
            if (member.roles.cache.has(role.id)) {
                await ctx.reply({ embeds: [infoEmbed(`You already have ${role}. Use \`/selfrole drop\` to remove it.`)] });
                return;
            }
            await member.roles.add(role.id, "Self-assignable role").catch(() => { });
            await ctx.reply({ embeds: [successEmbed(`✅ You now have the ${role} role!`)] });
        }
        else if (sub === "drop") {
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            if (!selfRoles.includes(role.id)) {
                await ctx.reply({ embeds: [errorEmbed(`${role} is not a self-assignable role.`)] });
                return;
            }
            if (!member) {
                await ctx.reply({ embeds: [errorEmbed("Could not find your server profile.")] });
                return;
            }
            if (!member.roles.cache.has(role.id)) {
                await ctx.reply({ embeds: [infoEmbed(`You don't have ${role}.`)] });
                return;
            }
            await member.roles.remove(role.id, "Self-assignable role drop").catch(() => { });
            await ctx.reply({ embeds: [successEmbed(`✅ Removed ${role} from your roles.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: add | remove | list | get | drop")] });
        }
    },
};
export default command;
//# sourceMappingURL=selfrole.js.map