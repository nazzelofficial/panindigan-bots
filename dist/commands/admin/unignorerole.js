import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "unignorerole",
    description: "Allow a previously ignored role to use bot commands again",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addRoleOption((o) => o.setName("role").setDescription("Role to unignore").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const roleId = ctx.isSlash
            ? ctx.interaction.options.getRole("role", true).id
            : ctx.args[0]?.replace(/\D/g, "");
        if (!roleId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { ignoredRoles: roleId } });
        await ctx.reply({ embeds: [successEmbed(`Members with <@&${roleId}> can now use bot commands again.`)] });
    },
};
export default command;
//# sourceMappingURL=unignorerole.js.map