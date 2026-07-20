import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "ascii",
  description: "Convert text to ASCII art",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("text").setDescription("Text to convert").setRequired(true)),
  async execute(ctx) {
    const text = ctx.isSlash ? ctx.interaction!.options.getString("text", true) : ctx.args.join(" ");
    await ctx.reply({ embeds: [infoEmbed(`🔤 ASCII art for "${text}":\n\`\`\`\n${text}\n\`\`\``)] });
  },
};
export default command;
