import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "convert",
  description: "Convert units",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) =>
        o.setName("type")
          .setDescription("Conversion type")
          .setRequired(true)
          .addChoices(
            { name: "Temperature", value: "temp" },
            { name: "Length", value: "length" },
            { name: "Weight", value: "weight" },
            { name: "Currency", value: "currency" }
          )
      )
      .addNumberOption((o) => o.setName("value").setDescription("Value to convert").setRequired(true))
      .addStringOption((o) => o.setName("from").setDescription("From unit").setRequired(true))
      .addStringOption((o) => o.setName("to").setDescription("To unit").setRequired(true)),
  async execute(ctx) {
    const type = ctx.isSlash ? ctx.interaction!.options.getString("type", true) : ctx.args[0];
    const value = ctx.isSlash ? ctx.interaction!.options.getNumber("value", true) : parseFloat(ctx.args[1]);
    const from = ctx.isSlash ? ctx.interaction!.options.getString("from", true) : ctx.args[2];
    const to = ctx.isSlash ? ctx.interaction!.options.getString("to", true) : ctx.args[3];

    const embed = baseEmbed("primary")
      .setTitle("🔄 Unit Conversion")
      .setDescription(`${value} ${from} = ${value} ${to} (${type})`);

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
