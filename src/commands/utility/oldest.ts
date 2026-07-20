import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "oldest",
  description: "Show the oldest member in the server",
  category: "Utility",
  access: "general",
  guildOnly: true,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    if (ctx.isSlash) await ctx.interaction!.deferReply();
    await guild.members.fetch();

    const members = guild.members.cache.sort((a, b) => (a.joinedAt?.getTime() ?? Infinity) - (b.joinedAt?.getTime() ?? Infinity));
    const oldest = members.first();

    const embed = baseEmbed("primary")
      .setTitle("👴 Oldest Member")
      .setDescription(oldest ? `<@${oldest.user.id}> joined ${oldest.joinedAt ? `<t:${Math.floor(oldest.joinedAt.getTime() / 1000)}:R>` : "Unknown"}` : "No members")
      .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
