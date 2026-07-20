import { Events, GuildMember, PartialGuildMember } from "discord.js";
import type { EventDefinition } from "../structures/types.js";
import { sendLogEvent } from "../features/logging/logEngine.js";
import { baseEmbed } from "../utils/embeds.js";
import { GuildModel } from "../database/models/Guild.js";
import { createGoodbyeEmbed } from "../utils/goodbyeEmbed.js";
import { scopedLogger } from "../utils/logger.js";

const log = scopedLogger("member-remove");

const event: EventDefinition = {
  name: Events.GuildMemberRemove,
  async execute(_client, member: GuildMember | PartialGuildMember) {
    const cfg = await GuildModel.findOne({ guildId: member.guild.id }).lean();
    const goodbye = (cfg as any)?.goodbye;

    if (goodbye?.enabled && goodbye.channelId) {
      const ch = member.guild.channels.cache.get(goodbye.channelId);
      if (ch?.isTextBased()) {
        try {
          const { embed, attachment } = await createGoodbyeEmbed({
            user: member.user!,
            guild: member.guild,
            channel: ch as any,
            config: goodbye,
          });

          if (goodbye.dmEnabled) {
            await member.user?.send({ embeds: [embed], files: attachment ? [attachment] : [] }).catch(() => {});
          }

          if (goodbye.embed) {
            await ch.send({ embeds: [embed], files: attachment ? [attachment] : [] }).catch(() => {});
          } else {
            const msg = (goodbye.message ?? "Goodbye {user}! We hope to see you again.")
              .replace("{user}", member.user?.username ?? "someone")
              .replace("{mention}", `<@${member.id}>`)
              .replace("{server}", member.guild.name)
              .replace("{memberCount}", String(member.guild.memberCount));
            await ch.send({ content: msg }).catch(() => {});
          }

          log.info(`Goodbye message sent for ${member.user?.tag} in ${member.guild.name}`);
        } catch (error) {
          log.error("Failed to send goodbye message", { error: String(error) });
        }
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
