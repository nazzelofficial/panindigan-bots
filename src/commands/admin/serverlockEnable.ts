import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "serverlock_enable",
  description: "Enable server lockdown",
  category: "Admin",
  access: "admin",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { locked: true, lockedReason: "Server lockdown enabled" },
      { upsert: true }
    );

    await ctx.reply({ embeds: [successEmbed("Server lockdown enabled")] });
  },
};
export default command;
