import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "guessnumber",
  description: "Guess a number between 1 and 100",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) => o.setName("guess").setDescription("Your guess").setRequired(true).setMinValue(1).setMaxValue(100)),
  async execute(ctx) {
    const guess = ctx.isSlash ? ctx.interaction!.options.getInteger("guess", true) : parseInt(ctx.args[0] ?? "0");
    const secret = Math.floor(Math.random() * 100) + 1;

    let result: string;
    if (guess === secret) {
      result = `🎉 Correct! The number was ${secret}!`;
    } else if (guess < secret) {
      result = `📈 Too low! The number was ${secret}.`;
    } else {
      result = `📉 Too high! The number was ${secret}.`;
    }

    const embed = baseEmbed("primary").setTitle("🔢 Guess the Number").setDescription(result);

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
