import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "buttonremove",
    description: "Remove a button role by message ID",
    category: "Reaction Roles",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the button panel to remove").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? ctx.interaction.options.getString("message_id", true) : ctx.args[0];
        if (!messageId) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a message ID.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { reactionRoles: { messageId, type: "button" } } });
        await ctx.reply({ embeds: [successEmbed(`Button role panel \`${messageId}\` removed from the database. Delete the Discord message manually if needed.`)] });
    },
};
export default command;
//# sourceMappingURL=buttonRemove.js.map