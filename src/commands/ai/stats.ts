import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";

const command: CommandDefinition = {
  name: "aistats",
  description: "View AI command usage statistics and request counts",
  category: "AI",
  access: "general",
  guildOnly: true,
  async execute(ctx) {
    const embed = new EmbedBuilder()
      .setTitle("📊 AI Statistics")
      .setColor("#00ff00")
      .addFields(
        { name: "Total Requests", value: "0", inline: true },
        { name: "Tokens Used", value: "0", inline: true },
        { name: "Cost", value: "$0.00", inline: true }
      )
      .setTimestamp();
    
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
