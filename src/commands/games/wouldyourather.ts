import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed } from "../../utils/embeds.js";

const PROMPTS = [
  ["Always be too hot", "Always be too cold"],
  ["Speak every language", "Play every instrument"],
  ["Have super strength", "Have super speed"],
  ["Live without music", "Live without TV"],
  ["Only eat sweet food", "Only eat salty food"],
  ["Never use social media", "Never watch another movie"],
  ["Be invisible", "Be able to fly"],
  ["Know how you'll die", "Know when you'll die"],
  ["Always have slow internet", "Never use a phone again"],
  ["Be the funniest person in the room", "Be the smartest person in the room"],
  ["Always tell the truth", "Always do what you're told"],
  ["Eat your favorite food every day forever", "Never eat your favorite food again"],
  ["Have no WiFi forever", "Have no air conditioning forever"],
  ["Be famous on social media", "Be happy but completely unknown"],
  ["Study forever", "Work forever"],
  ["See a ghost", "Be a ghost"],
  ["Always live in a rainy place", "Always live in an extremely hot place"],
  ["Work abroad far from family", "Stay home with family but earn less"],
];

const command: CommandDefinition = {
  name: "wouldyourather",
  description: "Would you rather? A fun question game",
  category: "Games",
  access: "general",
  guildOnly: false,
  cooldown: 10,
  aliases: ["wyr"],
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    const [optA, optB] = prompt;
    const id = Date.now().toString(36);

    const votes: Record<"a" | "b", number> = { a: 0, b: 0 };
    const voted = new Set<string>();

    const buildEmbed = () =>
      baseEmbed("primary")
        .setTitle("🤔 Would You Rather…")
        .addFields(
          { name: "🅰️ Option A", value: optA, inline: true },
          { name: "🅱️ Option B", value: optB, inline: true },
          { name: "Votes", value: `🅰️ **${votes.a}** vs 🅱️ **${votes.b}**`, inline: false },
        )
        .setFooter({ text: "Vote with the buttons below! Closes in 60 seconds." });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`wyr:${id}:a`).setLabel("🅰️ " + optA.slice(0, 40)).setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`wyr:${id}:b`).setLabel("🅱️ " + optB.slice(0, 40)).setStyle(ButtonStyle.Secondary),
    );

    await ctx.reply({ embeds: [buildEmbed()], components: [row] });

    const key = `wyr:${id}`;
    ctx.client.componentHandlers.set(key, async (interaction) => {
      if (!interaction.isButton()) return;
      if (voted.has(interaction.user.id)) { await interaction.reply({ content: "You already voted!", ephemeral: true }); return; }
      voted.add(interaction.user.id);
      const choice = interaction.customId.split(":")[2] as "a" | "b";
      votes[choice]++;
      await interaction.update({ embeds: [buildEmbed()], components: [row] });
    });

    setTimeout(async () => {
      ctx.client.componentHandlers.delete(key);
      const winner = votes.a > votes.b ? `🅰️ ${optA}` : votes.b > votes.a ? `🅱️ ${optB}` : "It's a tie!";
      const finalEmbed = baseEmbed("success")
        .setTitle("🤔 Would You Rather — Results")
        .addFields(
          { name: "🅰️ " + optA, value: `${votes.a} vote(s)`, inline: true },
          { name: "🅱️ " + optB, value: `${votes.b} vote(s)`, inline: true },
          { name: "Winner", value: winner, inline: false },
        );
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`wyr:${id}:a:d`).setLabel("🅰️ " + optA.slice(0, 40)).setStyle(ButtonStyle.Primary).setDisabled(true),
        new ButtonBuilder().setCustomId(`wyr:${id}:b:d`).setLabel("🅱️ " + optB.slice(0, 40)).setStyle(ButtonStyle.Secondary).setDisabled(true),
      );
      // Try to edit the original reply
      if (ctx.isSlash) ctx.interaction!.editReply({ embeds: [finalEmbed], components: [disabledRow] }).catch(() => {});
    }, 60_000);
  },
};
export default command;
