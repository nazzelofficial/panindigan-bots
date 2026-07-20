import { Events, GuildBan } from "discord.js";
import type { EventDefinition } from "../structures/types.js";
import { sendLogEvent } from "../features/logging/logEngine.js";
import { baseEmbed } from "../utils/embeds.js";

const event: EventDefinition = {
  name: Events.GuildBanAdd,
  async execute(_client, ban: GuildBan) {
    await sendLogEvent(ban.guild.id, "banAdd", () =>
      baseEmbed("danger")
        .setTitle("🔨 Member Banned")
        .setThumbnail(ban.user.displayAvatarURL())
        .addFields(
          { name: "User", value: `${ban.user.username} (<@${ban.user.id}>)`, inline: true },
          { name: "ID", value: ban.user.id, inline: true },
          { name: "Reason", value: ban.reason ?? "No reason provided", inline: false },
        )
        .setFooter({ text: `User ID: ${ban.user.id}` })
        .setTimestamp(),
    );
  },
};

export default event;
