import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "8ball",
  description: "Ask the magic 8-ball a question",
  category: "Utility",
  access: "general",
  guildOnly: false,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("question").setDescription("Your question").setRequired(true)),
  async execute(ctx) {
    const responses = ["Yes", "No", "Maybe", "Ask again later", "Cannot predict now", "Don't count on it"];
    const response = responses[Math.floor(Math.random() * responses.length)];

    await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🎱 Magic 8-Ball").setDescription(response)] });
  },
};
export default command;
