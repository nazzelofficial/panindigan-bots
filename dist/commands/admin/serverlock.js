import { PermissionFlagsBits, ChannelType } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, warnEmbed } from "../../utils/embeds";
const command = {
    name: "serverlock",
    description: "Lock or unlock all channels in the server (lockdown)",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageGuild],
    botPermissions: [PermissionFlagsBits.ManageChannels],
    cooldown: 10,
    aliases: ["lockdown", "serverunlock"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("lock")
        .setDescription("Lock all text channels (server lockdown)")
        .addStringOption((o) => o.setName("reason").setDescription("Reason for the lockdown").setRequired(false)))
        .addSubcommand((s) => s
        .setName("unlock")
        .setDescription("Unlock all text channels")
        .addStringOption((o) => o.setName("reason").setDescription("Reason for unlocking").setRequired(false))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() === "serverunlock" ? "unlock" : ctx.args[0]?.toLowerCase()) ?? "lock";
        const reason = ctx.isSlash ? ctx.interaction.options.getString("reason") ?? "No reason provided" : ctx.args.slice(1).join(" ") || "No reason provided";
        await ctx.reply({ embeds: [warnEmbed(`${sub === "lock" ? "🔒 Locking" : "🔓 Unlocking"} all channels…`)] });
        const everyoneRole = guild.roles.everyone;
        const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText && c.manageable);
        let success = 0;
        let failed = 0;
        for (const [, channel] of textChannels) {
            try {
                if (sub === "lock") {
                    await channel.permissionOverwrites.edit(everyoneRole, {
                        SendMessages: false,
                        AddReactions: false,
                    }, { reason: `Serverlock: ${reason}` });
                }
                else {
                    await channel.permissionOverwrites.edit(everyoneRole, {
                        SendMessages: null,
                        AddReactions: null,
                    }, { reason: `Serverunlock: ${reason}` });
                }
                success++;
            }
            catch {
                failed++;
            }
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "lockdown.enabled": sub === "lock", "lockdown.reason": reason } }, { upsert: true });
        const embed = successEmbed(`${sub === "lock" ? "🔒 Server locked" : "🔓 Server unlocked"}.\n**Reason:** ${reason}\n**Channels:** ${success} success, ${failed} failed.`);
        const followChannel = ctx.interaction?.channel ?? ctx.message?.channel;
        if (followChannel?.isTextBased?.()) {
            await followChannel.send({ embeds: [embed] }).catch(() => { });
        }
    },
};
export default command;
//# sourceMappingURL=serverlock.js.map