import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "percentage",
  description: "Calculate percentage",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addNumberOption((o) => o.setName("value").setDescription("Value").setRequired(true))
      .addNumberOption((o) => o.setName("total").setDescription("Total").setRequired(true)),
  async execute(ctx) {
    const value = ctx.isSlash ? ctx.interaction!.options.getNumber("value", true) : parseFloat(ctx.args[0] ?? "0");
    const total = ctx.isSlash ? ctx.interaction!.options.getNumber("total", true) : parseFloat(ctx.args[1] ?? "0");
    const percentage = total === 0 ? 0 : ((value / total) * 100).toFixed(2);

    const embed = baseEmbed("primary").setTitle("📊 Percentage").setDescription(`${value} is ${percentage}% of ${total}`);

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
