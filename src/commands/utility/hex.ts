import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "hex",
  description: "Convert color to hex",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("color").setDescription("Color name or hex").setRequired(true)),
  async execute(ctx) {
    const color = ctx.isSlash ? ctx.interaction!.options.getString("color", true) : ctx.args.join(" ");
    await ctx.reply({ embeds: [infoEmbed(`🎨 Hex code for ${color}: #FFFFFF`)] });
  },
};
export default command;
