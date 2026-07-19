import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "coloradd",
    description: "Add a color role to the color chooser panel",
    category: "Reaction Roles",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addRoleOption((o) => o.setName("role").setDescription("Color role to add to the chooser").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const roleId = ctx.isSlash ? ctx.interaction.options.getRole("role", true).id : ctx.args[0]?.replace(/\D/g, "");
        if (!roleId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { "colorRoles.roleIds": roleId } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`<@&${roleId}> added to the color chooser.`)] });
    },
};
export default command;
//# sourceMappingURL=colorAdd.js.map