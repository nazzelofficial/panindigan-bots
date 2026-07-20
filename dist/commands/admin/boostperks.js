import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "boostperks",
    description: "Configure rewards that are automatically given to server boosters",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["boostperk", "boosterperks"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("setup")
        .setDescription("Add a role to automatically give to boosters")
        .addRoleOption((o) => o.setName("role").setDescription("Role to give boosters").setRequired(true))
        .addStringOption((o) => o.setName("description").setDescription("Description of this perk").setRequired(false)))
        .addSubcommand((s) => s.setName("list").setDescription("List all configured booster perks"))
        .addSubcommand((s) => s.setName("remove")
        .setDescription("Remove a booster perk role")
        .addRoleOption((o) => o.setName("role").setDescription("Role to remove from perks").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "list";
        if (sub === "setup") {
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            const description = ctx.isSlash ? (ctx.interaction.options.getString("description") ?? "Booster exclusive role") : ctx.args.slice(2).join(" ") || "Booster exclusive role";
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { boostPerkRoleIds: { roleId: role.id, description } } }, { upsert: true });
            await ctx.reply({
                embeds: [
                    successEmbed(`${role} is now a **booster perk**!\n\nPerk: "${description}"\n\nThis role will be automatically given to members when they boost the server (configure with guildMemberUpdate event).`),
                ],
            });
        }
        else if (sub === "list") {
            const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
            const perks = doc?.boostPerkRoleIds ?? [];
            if (!perks.length) {
                await ctx.reply({ embeds: [infoEmbed("No booster perks configured. Use `/boostperks setup` to add one.")] });
                return;
            }
            const embed = baseEmbed("premium")
                .setTitle("💎 Booster Perks")
                .setDescription(perks.map((p) => `${p.roleId ? `<@&${p.roleId}>` : p} — ${p.description ?? "Booster role"}`).join("\n"))
                .setFooter({ text: "These roles are automatically given to server boosters" });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "remove") {
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role", true) : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!role) {
                await ctx.reply({ embeds: [errorEmbed("Role not found.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { boostPerkRoleIds: { roleId: role.id } } });
            await ctx.reply({ embeds: [successEmbed(`${role} removed from booster perks.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: setup | list | remove")] });
        }
    },
};
export default command;
//# sourceMappingURL=boostperks.js.map