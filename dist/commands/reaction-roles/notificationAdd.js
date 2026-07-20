import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "notificationadd",
    description: "Add a notification role that members can self-assign for pings/updates",
    category: "Reaction Roles",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addRoleOption((o) => o.setName("role").setDescription("Notification role to add").setRequired(true))
        .addStringOption((o) => o.setName("description").setDescription("What this role is for (e.g. 'Game Updates')").setRequired(false).setMaxLength(100)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const roleId = ctx.isSlash ? ctx.interaction.options.getRole("role", true).id : ctx.args[0]?.replace(/\D/g, "");
        const description = ctx.isSlash ? (ctx.interaction.options.getString("description") ?? null) : ctx.args.slice(1).join(" ") || null;
        if (!roleId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { notificationRoles: { roleId, description: description ?? "Notification role" } } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`<@&${roleId}> added as a notification role${description ? ` (${description})` : ""}.`)] });
    },
};
export default command;
//# sourceMappingURL=notificationAdd.js.map