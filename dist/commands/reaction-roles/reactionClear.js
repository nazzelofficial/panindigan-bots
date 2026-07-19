import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed } from "../../utils/embeds";
const command = {
    name: "reactionclear",
    description: "Remove all reaction roles from a specific message (or all if no message specified)",
    category: "Reaction Roles",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID to clear reaction roles from (leave empty to clear all)").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? (ctx.interaction.options.getString("message_id") ?? null) : (ctx.args[0] ?? null);
        if (messageId) {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { reactionRoles: { messageId, type: "reaction" } } });
            await ctx.reply({ embeds: [successEmbed(`All reaction roles cleared from message \`${messageId}\`.`)] });
        }
        else {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { reactionRoles: { type: "reaction" } } });
            await ctx.reply({ embeds: [successEmbed("All reaction roles cleared from this server.")] });
        }
    },
};
export default command;
//# sourceMappingURL=reactionClear.js.map