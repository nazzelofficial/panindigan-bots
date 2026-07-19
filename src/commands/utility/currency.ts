import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "currency",
  description: "Convert currency",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addNumberOption((o) => o.setName("amount").setDescription("Amount").setRequired(true))
      .addStringOption((o) => o.setName("from").setDescription("From currency (e.g., USD)").setRequired(true))
      .addStringOption((o) => o.setName("to").setDescription("To currency (e.g., EUR)").setRequired(true)),
  async execute(ctx) {
    const amount = ctx.isSlash ? ctx.interaction!.options.getNumber("amount", true) : parseFloat(ctx.args[0]);
    const from = ctx.isSlash ? ctx.interaction!.options.getString("from", true) : ctx.args[1];
    const to = ctx.isSlash ? ctx.interaction!.options.getString("to", true) : ctx.args[2];

    const embed = baseEmbed("primary")
      .setTitle("💱 Currency Conversion")
      .setDescription(`${amount} ${from} = ${amount} ${to} (placeholder)`);

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
