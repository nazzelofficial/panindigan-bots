import { Events } from "discord.js";
import { sendLogEvent } from "@/features/logging/logEngine";
import { baseEmbed } from "@/utils/embeds";
import { cacheEditedMessage } from "@/commands/utility/snipe";
const event = {
    name: Events.MessageUpdate,
    async execute(_client, oldMessage, newMessage) {
        if (newMessage.author?.bot)
            return;
        if (!newMessage.guildId)
            return;
        if (oldMessage.content === newMessage.content)
            return;
        const oldContent = oldMessage.content ?? "*Unknown*";
        const newContent = newMessage.content ?? "*Empty*";
        const authorTag = newMessage.author?.username ?? "Unknown";
        const authorId = newMessage.author?.id ?? "0";
        const channelId = newMessage.channelId;
        cacheEditedMessage(channelId, oldContent, newContent, authorTag, authorId);
        await sendLogEvent(newMessage.guildId, "messageUpdate", () => baseEmbed("warning")
            .setTitle("✏️ Message Edited")
            .addFields({ name: "Author", value: `${authorTag} (<@${authorId}>)`, inline: true }, { name: "Channel", value: `<#${channelId}>`, inline: true }, { name: "Before", value: oldContent.slice(0, 1000) || "*(empty)*", inline: false }, { name: "After", value: newContent.slice(0, 1000) || "*(empty)*", inline: false })
            .setFooter({ text: `Message ID: ${newMessage.id}` })
            .setTimestamp());
    },
};
export default event;
//# sourceMappingURL=messageUpdate.js.map