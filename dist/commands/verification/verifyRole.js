import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "verifyrole",
    description: "Set the role given to members after they complete verification",
    category: "Verification",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addRoleOption((o) => o.setName("role").setDescription("Role to assign upon verification").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const roleId = ctx.isSlash ? ctx.interaction.options.getRole("role", true).id : ctx.args[0]?.replace(/\D/g, "");
        if (!roleId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a role.")] });
            return;
        }
        const botMember = guild.members.cache.get(ctx.client.user.id);
        const role = guild.roles.cache.get(roleId);
        if (role && botMember && role.position >= botMember.roles.highest.position) {
            await ctx.reply({ embeds: [errorEmbed("That role is higher than my highest role. I cannot assign it.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "verification.roleId": roleId, verifiedRoleId: roleId } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Verified role set to <@&${roleId}>. Members will receive it after completing verification.`)] });
    },
};
export default command;
//# sourceMappingURL=verifyRole.js.map