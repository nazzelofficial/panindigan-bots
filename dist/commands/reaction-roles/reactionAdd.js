import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "reactionadd",
    description: "Add a reaction role — users react with an emoji on a message to get a role",
    category: "Reaction Roles",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addStringOption((o) => o.setName("message_id").setDescription("ID of the message to add the reaction to").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji to react with").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role to assign when reacted").setRequired(true))
        .addChannelOption((o) => o.setName("channel").setDescription("Channel containing the message (default: current channel)").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const messageId = ctx.isSlash ? ctx.interaction.options.getString("message_id", true) : ctx.args[0];
        const emoji = ctx.isSlash ? ctx.interaction.options.getString("emoji", true) : ctx.args[1];
        const roleId = ctx.isSlash ? ctx.interaction.options.getRole("role", true).id : ctx.args[2]?.replace(/\D/g, "");
        const channelId = ctx.isSlash ? (ctx.interaction.options.getChannel("channel")?.id ?? ctx.interaction.channelId) : (ctx.message?.channelId ?? "");
        if (!messageId || !emoji || !roleId) {
            await ctx.reply({ embeds: [errorEmbed("Provide message ID, emoji, and role.")] });
            return;
        }
        const channel = guild.channels.cache.get(channelId);
        if (!channel?.isTextBased()) {
            await ctx.reply({ embeds: [errorEmbed("Channel not found or not a text channel.")] });
            return;
        }
        try {
            const msg = await channel.messages.fetch(messageId);
            await msg.react(emoji);
        }
        catch {
            await ctx.reply({ embeds: [errorEmbed("Could not find or react to that message. Check the message ID and my permissions.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { reactionRoles: { type: "reaction", messageId, channelId, emoji, roleId } } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Reaction role added! Members who react with ${emoji} on that message will receive <@&${roleId}>.`)] });
    },
};
export default command;
//# sourceMappingURL=reactionAdd.js.map