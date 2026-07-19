import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "premiumroleset",
    description: "Set the role displayed for premium members in this server",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    aliases: ["setpremiumrole", "premiumrole"],
    slashData: (b) => b
        .addRoleOption((o) => o.setName("role").setDescription("Role to assign to premium members").setRequired(true)),
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
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { premiumRoleId: roleId } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Premium member role set to <@&${roleId}>.`)] });
    },
};
export default command;
//# sourceMappingURL=premiumroleSet.js.map