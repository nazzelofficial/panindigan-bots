import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "backup_list",
  description: "List all server backups",
  category: "Admin",
  access: "admin",
  guildOnly: true,
  async execute(ctx) {
    const embed = baseEmbed("primary")
      .setTitle("💾 Server Backups")
      .setDescription("No backups available")
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
