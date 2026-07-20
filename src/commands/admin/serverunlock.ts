import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { sendLogEvent } from "../../features/logging/logEngine.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "serverunlock",
  description: "Unlock the entire server and restore normal permissions",
  category: "Admin",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  cooldown: 10,
  aliases: ["unlockserver", "sunlock"],
  slashData: (_b) => _b,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    if (!(cfg as any)?.locked) {
      await ctx.reply({ embeds: [errorEmbed("This server is not currently locked.")] });
      return;
    }

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $set: { locked: false, lockedReason: null } },
    );

    const everyoneRole = guild.roles.everyone;
    let unlockedCount = 0;

    for (const channel of guild.channels.cache.values()) {
      if (!["GuildText", "GuildAnnouncement"].includes(channel.type.toString())) continue;
      try {
        await (channel as any).permissionOverwrites.edit(everyoneRole, {
          SendMessages: null,
        });
        unlockedCount++;
      } catch {
        // Skip channels we can't modify
      }
    }

    await sendLogEvent(guild.id, "serverUnlock", () =>
      baseEmbed("success")
        .setTitle("🔓 Server Unlocked")
        .setDescription(`**Unlocked by:** <@${ctx.userId}>\n**Channels restored:** ${unlockedCount}`),
    );

    await ctx.reply({
      embeds: [successEmbed(`Server unlocked. Restored send permissions in **${unlockedCount}** channels.`)],
    });
  },
};

export default command;
