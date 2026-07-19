import { Events } from "discord.js";
import { sendLogEvent } from "@/features/logging/logEngine";
import { baseEmbed } from "@/utils/embeds";
const event = {
    name: Events.VoiceStateUpdate,
    async execute(_client, oldState, newState) {
        if (!newState.guild)
            return;
        const guildId = newState.guild.id;
        const userId = newState.id;
        const userTag = newState.member?.user.username ?? userId;
        if (!oldState.channelId && newState.channelId) {
            await sendLogEvent(guildId, "voiceJoin", () => baseEmbed("success")
                .setTitle("🔊 Member Joined Voice")
                .addFields({ name: "Member", value: `${userTag} (<@${userId}>)`, inline: true }, { name: "Channel", value: `<#${newState.channelId}>`, inline: true })
                .setFooter({ text: `User ID: ${userId}` })
                .setTimestamp());
        }
        else if (oldState.channelId && !newState.channelId) {
            await sendLogEvent(guildId, "voiceLeave", () => baseEmbed("danger")
                .setTitle("🔇 Member Left Voice")
                .addFields({ name: "Member", value: `${userTag} (<@${userId}>)`, inline: true }, { name: "Channel", value: `<#${oldState.channelId}>`, inline: true })
                .setFooter({ text: `User ID: ${userId}` })
                .setTimestamp());
        }
        else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            await sendLogEvent(guildId, "voiceJoin", () => baseEmbed("info")
                .setTitle("🔊 Member Moved Voice Channels")
                .addFields({ name: "Member", value: `${userTag} (<@${userId}>)`, inline: true }, { name: "From", value: `<#${oldState.channelId}>`, inline: true }, { name: "To", value: `<#${newState.channelId}>`, inline: true })
                .setFooter({ text: `User ID: ${userId}` })
                .setTimestamp());
        }
    },
};
export default event;
//# sourceMappingURL=voiceStateUpdate.js.map