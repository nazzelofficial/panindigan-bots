import { Events, GuildBan } from "discord.js";
import type { EventDefinition } from "../structures/types.js";
import { sendLogEvent } from "../features/logging/logEngine.js";
import { baseEmbed } from "../utils/embeds.js";

const event: EventDefinition = {
  name: Events.GuildBanRemove,
  async execute(_client, ban: GuildBan) {
    await sendLogEvent(ban.guild.id, "banRemove", () =>
      baseEmbed("success")
        .setTitle("✅ Member Unbanned")
        .setThumbnail(ban.user.displayAvatarURL())
        .addFields(
          { name: "User", value: `${ban.user.username} (<@${ban.user.id}>)`, inline: true },
          { name: "ID", value: ban.user.id, inline: true },
        )
        .setFooter({ text: `User ID: ${ban.user.id}` })
        .setTimestamp(),
    );
  },
};

export default event;
