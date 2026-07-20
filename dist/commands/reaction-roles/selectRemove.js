import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "selectremove",
    description: "Remove a select-menu role panel by message ID",
    category: "Reaction Roles",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("Message ID of the select panel to remove").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? ctx.interaction.options.getString("message_id", true) : ctx.args[0];
        if (!messageId) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a message ID.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { reactionRoles: { messageId, type: "select" } } });
        await ctx.reply({ embeds: [successEmbed(`Select role panel \`${messageId}\` removed.`)] });
    },
};
export default command;
//# sourceMappingURL=selectRemove.js.map