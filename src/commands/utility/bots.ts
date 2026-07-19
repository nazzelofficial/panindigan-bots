import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "bots",
  description: "List all bots in the server",
  category: "Utility",
  access: "general",
  guildOnly: true,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const bots = guild.members.cache.filter((m) => m.user.bot);
    const botList = bots.map((b) => `${b.user.tag} - <@${b.user.id}>`).join("\n") || "No bots";

    if (!bots.size) {
      await ctx.reply({ embeds: [infoEmbed("No bots in this server.")] });
      return;
    }

    const embed = baseEmbed("primary")
      .setTitle("🤖 Server Bots")
      .setDescription(botList.slice(0, 4096))
      .setFooter({ text: `${bots.size} bot(s)` })
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
