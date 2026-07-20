import { PermissionFlagsBits, ChannelType } from "discord.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "lock",
    description: "Lock or unlock a channel",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    aliases: ["lockdown"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("lock")
        .setDescription("Lock a channel (deny @everyone from sending messages)")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to lock (default: current)").setRequired(false))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)))
        .addSubcommand((s) => s.setName("unlock")
        .setDescription("Unlock a previously locked channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Channel to unlock (default: current)").setRequired(false))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "lock";
        const targetChannel = ctx.isSlash
            ? (ctx.interaction.options.getChannel("channel") ?? ctx.interaction.channel)
            : ctx.message?.channel;
        const reason = ctx.isSlash ? ctx.interaction.options.getString("reason") ?? "No reason provided" : ctx.args.slice(1).join(" ") || "No reason provided";
        if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
            await ctx.reply({ embeds: [errorEmbed("Provide a text channel.")] });
            return;
        }
        const everyoneRole = guild.roles.everyone;
        if (sub === "lock" || sub === "channel") {
            await targetChannel.permissionOverwrites.edit(everyoneRole, { SendMessages: false }, { reason });
            await targetChannel.send({ embeds: [errorEmbed(`🔒 Channel locked by <@${ctx.userId}>. Reason: ${reason}`)] }).catch(() => { });
            await ctx.reply({ embeds: [successEmbed(`🔒 <#${targetChannel.id}> locked. Reason: ${reason}`)] });
        }
        else {
            await targetChannel.permissionOverwrites.edit(everyoneRole, { SendMessages: null }, { reason });
            await targetChannel.send({ embeds: [successEmbed(`🔓 Channel unlocked by <@${ctx.userId}>. Reason: ${reason}`)] }).catch(() => { });
            await ctx.reply({ embeds: [successEmbed(`🔓 <#${targetChannel.id}> unlocked.`)] });
        }
    },
};
export default command;
//# sourceMappingURL=lock.js.map