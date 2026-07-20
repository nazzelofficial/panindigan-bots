import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed } from "../../utils/embeds.js";

const CHOICES = ["rock", "paper", "scissors"] as const;
type Choice = typeof CHOICES[number];
const EMOJI: Record<Choice, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };
const BEATS: Record<Choice, Choice> = { rock: "scissors", paper: "rock", scissors: "paper" };

const command: CommandDefinition = {
  name: "rps",
  description: "Play rock-paper-scissors against the bot",
  category: "Games",
  access: "general",
  guildOnly: false,
  cooldown: 3,
  aliases: ["rockpaperscissors"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("choice").setDescription("Your choice").setRequired(true)
        .addChoices({ name: "Rock", value: "rock" }, { name: "Paper", value: "paper" }, { name: "Scissors", value: "scissors" }),
    ),
  async execute(ctx) {
    const userChoice = (ctx.isSlash ? ctx.interaction!.options.getString("choice", true) : ctx.args[0]?.toLowerCase()) as Choice;
    if (!CHOICES.includes(userChoice)) { await ctx.reply("Choose: rock, paper, or scissors."); return; }
    const botChoice = CHOICES[Math.floor(Math.random() * 3)];
    let result: string; let color: "success" | "danger" | "warning";
    if (userChoice === botChoice) { result = "It's a **tie**!"; color = "warning"; }
    else if (BEATS[userChoice] === botChoice) { result = "You **win**! 🎉"; color = "success"; }
    else { result = "You **lose**! 😢"; color = "danger"; }
    await ctx.reply({
      embeds: [
        baseEmbed(color)
          .setTitle("✂️ Rock Paper Scissors")
          .addFields(
            { name: "You", value: `${EMOJI[userChoice]} ${userChoice}`, inline: true },
            { name: "Bot", value: `${EMOJI[botChoice]} ${botChoice}`, inline: true },
            { name: "Result", value: result, inline: false },
          ),
      ],
    });
  },
};
export default command;
