import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "channellist",
  description: "List all channels in the server",
  category: "Utility",
  access: "general",
  guildOnly: true,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const channels = guild.channels.cache;
    const textChannels = channels.filter((c) => c.isTextBased()).map((c) => c.name).join(", ") || "None";
    const voiceChannels = channels.filter((c) => c.isVoiceBased()).map((c) => c.name).join(", ") || "None";

    const embed = baseEmbed("primary")
      .setTitle("📋 Channel List")
      .addFields(
        { name: "Text Channels", value: textChannels.slice(0, 1024), inline: false },
        { name: "Voice Channels", value: voiceChannels.slice(0, 1024), inline: false }
      )
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
