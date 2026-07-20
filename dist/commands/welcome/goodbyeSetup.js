import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "goodbyesetup",
    description: "Quick setup for goodbye messages — set the channel and optionally a custom message",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 10,
    slashData: (b) => b
        .addChannelOption((o) => o.setName("channel").setDescription("Channel for goodbye messages").setRequired(true))
        .addStringOption((o) => o.setName("message").setDescription("Custom goodbye message (optional)").setRequired(false).setMaxLength(1000)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channelId = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true).id : ctx.args[0]?.replace(/\D/g, "");
        if (!channelId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a channel.")] });
            return;
        }
        const msg = ctx.isSlash ? ctx.interaction.options.getString("message") ?? null : ctx.args.slice(1).join(" ") || null;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "goodbye.channelId": channelId, "goodbye.enabled": true, ...(msg ? { "goodbye.message": msg } : {}) } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Goodbye messages **enabled** in <#${channelId}>${msg ? " with your custom message" : " with the default message"}.`)] });
    },
};
export default command;
//# sourceMappingURL=goodbyeSetup.js.map