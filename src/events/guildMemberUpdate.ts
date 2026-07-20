import { Events, GuildMember, PartialGuildMember } from "discord.js";
import type { EventDefinition } from "../structures/types.js";
import { sendLogEvent } from "../features/logging/logEngine.js";
import { baseEmbed } from "../utils/embeds.js";

const event: EventDefinition = {
  name: Events.GuildMemberUpdate,
  async execute(_client, oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
    const guildId = newMember.guild.id;
    const userId = newMember.id;
    const userTag = newMember.user.username;

    // Role changes
    if (oldMember.roles && newMember.roles) {
      const addedRoles = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
      const removedRoles = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));

      if (addedRoles.size > 0 || removedRoles.size > 0) {
        await sendLogEvent(guildId, "memberUpdate", () =>
          baseEmbed("info")
            .setTitle("🏷️ Member Roles Updated")
            .setThumbnail(newMember.user.displayAvatarURL())
            .addFields(
              { name: "Member", value: `${userTag} (<@${userId}>)`, inline: true },
              { name: "Roles Added", value: addedRoles.size ? addedRoles.map((r) => r.toString()).join(", ") : "None", inline: false },
              { name: "Roles Removed", value: removedRoles.size ? removedRoles.map((r) => r.toString()).join(", ") : "None", inline: false },
            )
            .setFooter({ text: `User ID: ${userId}` })
            .setTimestamp(),
        );
      }
    }

    // Nickname change
    if (oldMember.nickname !== newMember.nickname) {
      await sendLogEvent(guildId, "memberUpdate", () =>
        baseEmbed("info")
          .setTitle("📝 Nickname Changed")
          .addFields(
            { name: "Member", value: `${userTag} (<@${userId}>)`, inline: true },
            { name: "Before", value: oldMember.nickname ?? "*(none)*", inline: true },
            { name: "After", value: newMember.nickname ?? "*(none)*", inline: true },
          )
          .setFooter({ text: `User ID: ${userId}` })
          .setTimestamp(),
      );
    }

    // Timeout
    if (!oldMember.communicationDisabledUntilTimestamp && newMember.communicationDisabledUntilTimestamp) {
      await sendLogEvent(guildId, "timeout", () =>
        baseEmbed("warning")
          .setTitle("⏱️ Member Timed Out")
          .addFields(
            { name: "Member", value: `${userTag} (<@${userId}>)`, inline: true },
            { name: "Expires", value: `<t:${Math.floor((newMember.communicationDisabledUntilTimestamp ?? 0) / 1000)}:R>`, inline: true },
          )
          .setFooter({ text: `User ID: ${userId}` })
          .setTimestamp(),
      );
    }
  },
};

export default event;
