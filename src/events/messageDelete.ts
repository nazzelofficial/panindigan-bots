import { Events, Message, PartialMessage } from "discord.js";
import type { EventDefinition } from "@/structures/types";
import { sendLogEvent } from "@/features/logging/logEngine";
import { baseEmbed } from "@/utils/embeds";
import { cacheDeletedMessage } from "@/commands/utility/snipe";

const event: EventDefinition = {
  name: Events.MessageDelete,
  async execute(_client, message: Message | PartialMessage) {
    if (message.author?.bot) return;
    if (!message.guildId) return;

    const content = message.content ?? "*No text content*";
    const authorTag = message.author?.username ?? "Unknown";
    const authorId = message.author?.id ?? "0";
    const channelId = message.channelId;

    cacheDeletedMessage(channelId, content, authorTag, authorId);

    await sendLogEvent(message.guildId, "messageDelete", () =>
      baseEmbed("danger")
        .setTitle("🗑️ Message Deleted")
        .addFields(
          { name: "Author", value: `${authorTag} (<@${authorId}>)`, inline: true },
          { name: "Channel", value: `<#${channelId}>`, inline: true },
          { name: "Content", value: content.slice(0, 1024) || "*(empty)*", inline: false },
        )
        .setFooter({ text: `Message ID: ${message.id}` })
        .setTimestamp(),
    );
  },
};

export default event;
