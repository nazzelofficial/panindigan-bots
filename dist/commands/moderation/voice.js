import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed } from "../../utils/embeds";
import { createModCase } from "../../features/moderation/caseEngine";
const command = {
    name: "voice",
    description: "Voice moderation: kick, mute, unmute, deafen, undeafen, move members",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.MuteMembers],
    botPermissions: [PermissionFlagsBits.MuteMembers, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.DeafenMembers],
    guildOnly: true,
    cooldown: 3,
    aliases: ["vc"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("kick").setDescription("Disconnect a member from a voice channel")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)))
        .addSubcommand((s) => s.setName("mute").setDescription("Server-mute a member in voice")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)))
        .addSubcommand((s) => s.setName("unmute").setDescription("Remove server-mute from a member in voice")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)))
        .addSubcommand((s) => s.setName("deafen").setDescription("Server-deafen a member in voice")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)))
        .addSubcommand((s) => s.setName("undeafen").setDescription("Remove server-deafen from a member")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)))
        .addSubcommand((s) => s.setName("move").setDescription("Move a member to a different voice channel")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
        .addChannelOption((o) => o.setName("channel").setDescription("Target voice channel").setRequired(true)))
        .addSubcommand((s) => s.setName("muteall").setDescription("Server-mute all members in a voice channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Voice channel (defaults to bot's current channel)").setRequired(false)))
        .addSubcommand((s) => s.setName("unmuteall").setDescription("Remove server-mute from all muted members in a voice channel")
        .addChannelOption((o) => o.setName("channel").setDescription("Voice channel (defaults to bot's current channel)").setRequired(false))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        const reason = (ctx.isSlash ? ctx.interaction.options.getString("reason") : null) ?? "No reason provided";
        const getTarget = async () => {
            const id = ctx.isSlash ? ctx.interaction.options.getUser("user", true).id : ctx.args[1]?.replace(/\D/g, "");
            if (!id)
                return null;
            return guild.members.fetch(id).catch(() => null);
        };
        if (sub === "kick") {
            const member = await getTarget();
            if (!member) {
                await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
                return;
            }
            if (!member.voice.channel) {
                await ctx.reply({ embeds: [errorEmbed("That member is not in a voice channel.")] });
                return;
            }
            await member.voice.disconnect(reason);
            await createModCase({ guildId: guild.id, userId: member.id, moderatorId: ctx.userId, type: "kick", reason });
            await ctx.reply({ embeds: [successEmbed(`🔇 <@${member.id}> has been disconnected from the voice channel.`)] });
            return;
        }
        if (sub === "mute") {
            const member = await getTarget();
            if (!member) {
                await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
                return;
            }
            if (!member.voice.channel) {
                await ctx.reply({ embeds: [errorEmbed("That member is not in a voice channel.")] });
                return;
            }
            await member.voice.setMute(true, reason);
            await createModCase({ guildId: guild.id, userId: member.id, moderatorId: ctx.userId, type: "mute", reason });
            await ctx.reply({ embeds: [successEmbed(`🔇 <@${member.id}> has been server-muted in voice.`)] });
            return;
        }
        if (sub === "unmute") {
            const member = await getTarget();
            if (!member) {
                await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
                return;
            }
            if (!member.voice.channel) {
                await ctx.reply({ embeds: [errorEmbed("That member is not in a voice channel.")] });
                return;
            }
            await member.voice.setMute(false);
            await ctx.reply({ embeds: [successEmbed(`🔊 <@${member.id}> has been unmuted in voice.`)] });
            return;
        }
        if (sub === "deafen") {
            const member = await getTarget();
            if (!member) {
                await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
                return;
            }
            if (!member.voice.channel) {
                await ctx.reply({ embeds: [errorEmbed("That member is not in a voice channel.")] });
                return;
            }
            await member.voice.setDeaf(true, reason);
            await ctx.reply({ embeds: [successEmbed(`🔕 <@${member.id}> has been server-deafened in voice.`)] });
            return;
        }
        if (sub === "undeafen") {
            const member = await getTarget();
            if (!member) {
                await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
                return;
            }
            if (!member.voice.channel) {
                await ctx.reply({ embeds: [errorEmbed("That member is not in a voice channel.")] });
                return;
            }
            await member.voice.setDeaf(false);
            await ctx.reply({ embeds: [successEmbed(`🔔 <@${member.id}> has been undeafened in voice.`)] });
            return;
        }
        if (sub === "move") {
            const member = await getTarget();
            if (!member) {
                await ctx.reply({ embeds: [errorEmbed("Member not found.")] });
                return;
            }
            if (!member.voice.channel) {
                await ctx.reply({ embeds: [errorEmbed("That member is not in a voice channel.")] });
                return;
            }
            const targetCh = ctx.isSlash ? ctx.interaction.options.getChannel("channel", true) : null;
            if (!targetCh) {
                await ctx.reply({ embeds: [errorEmbed("Provide a target voice channel.")] });
                return;
            }
            const vc = guild.channels.cache.get(targetCh.id);
            if (!vc || vc.type !== 2) {
                await ctx.reply({ embeds: [errorEmbed("The target must be a voice channel.")] });
                return;
            }
            await member.voice.setChannel(vc, reason);
            await ctx.reply({ embeds: [successEmbed(`📤 <@${member.id}> has been moved to ${vc}.`)] });
            return;
        }
        if (sub === "muteall" || sub === "unmuteall") {
            const muting = sub === "muteall";
            const chOpt = ctx.isSlash ? ctx.interaction.options.getChannel("channel") : null;
            let vc = chOpt ? guild.channels.cache.get(chOpt.id) : null;
            if (!vc) {
                const botVc = guild.members.me?.voice.channel;
                vc = botVc ?? null;
            }
            if (!vc || vc.type !== 2) {
                await ctx.reply({ embeds: [errorEmbed("Provide a valid voice channel, or the bot must be in a voice channel.")] });
                return;
            }
            const members = vc.members;
            if (!members?.size) {
                await ctx.reply({ embeds: [errorEmbed("No members in that voice channel.")] });
                return;
            }
            let count = 0;
            for (const [, m] of members) {
                if (m.id === ctx.client.user.id)
                    continue;
                await m.voice.setMute(muting, reason).catch(() => { });
                count++;
            }
            await ctx.reply({ embeds: [successEmbed(`${muting ? "🔇 Server-muted" : "🔊 Unmuted"} **${count}** member${count !== 1 ? "s" : ""} in ${vc}.`)] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: kick | mute | unmute | deafen | undeafen | move | muteall | unmuteall")] });
    },
};
export default command;
//# sourceMappingURL=voice.js.map