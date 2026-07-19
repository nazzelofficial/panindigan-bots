import { Events, GuildMember, PartialGuildMember } from "discord.js";
import type { EventDefinition } from "@/structures/types";
import { sendLogEvent } from "@/features/logging/logEngine";
import { baseEmbed } from "@/utils/embeds";
import { GuildModel } from "@/database/models/Guild";

const event: EventDefinition = {
  name: Events.GuildMemberRemove,
  async execute(_client, member: GuildMember | PartialGuildMember) {
    const cfg = await GuildModel.findOne({ guildId: member.guild.id }).lean();
    const goodbye = (cfg as any)?.goodbye;

    if (goodbye?.enabled && goodbye.channelId) {
      const ch = member.guild.channels.cache.get(goodbye.channelId);
      if (ch?.isTextBased()) {
        const msg = (goodbye.message ?? "Goodbye {user}! We hope to see you again.")
          .replace("{user}", member.user?.username ?? "someone")
          .replace("{mention}", `<@${member.id}>`)
          .replace("{server}", member.guild.name)
          .replace("{memberCount}", String(member.guild.memberCount));
        await (ch as any).send({ content: msg }).catch(() => {});
      }
    }

    await sendLogEvent(member.guild.id, "memberLeave", () =>
      baseEmbed("danger")
        .setTitle("👋 Member Left")
        .setThumbnail(member.user?.displayAvatarURL() ?? null)
        .addFields(
          { name: "User", value: `${member.user?.username ?? "Unknown"} (<@${member.id}>)`, inline: true },
          { name: "ID", value: member.id, inline: true },
          { name: "Joined", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Unknown", inline: true },
          { name: "Member Count", value: String(member.guild.memberCount), inline: true },
        )
        .setFooter({ text: `User ID: ${member.id}` })
        .setTimestamp(),
    );
  },
};

export default event;
