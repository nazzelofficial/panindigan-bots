import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { baseEmbed, successEmbed, errorEmbed } from "@/utils/embeds";

const RIDDLES = [
  { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "echo" },
  { q: "The more you take, the more you leave behind. What am I?", a: "footsteps" },
  { q: "I have cities, but no houses live there. I have mountains, but no trees grow. I have water, but no fish swim. I have roads, but no cars drive. What am I?", a: "map" },
  { q: "What gets wetter as it dries?", a: "towel" },
  { q: "I have hands but cannot clap. What am I?", a: "clock" },
  { q: "I fly without wings. I cry without eyes. Wherever I go, darkness follows. What am I?", a: "cloud" },
  { q: "The more you have of it, the less you see. What is it?", a: "darkness" },
  { q: "I'm always running but never move, I have a bed but never sleep, and a mouth but never speak. What am I?", a: "river" },
  { q: "What can you catch but not throw?", a: "cold" },
  { q: "I have one eye but cannot see. What am I?", a: "needle" },
  { q: "What has keys but no locks, space but no room, and you can enter but can't go inside?", a: "keyboard" },
  { q: "I'm light as a feather, but even the strongest person can't hold me for more than a few minutes. What am I?", a: "breath" },
  { q: "The more you remove from me, the bigger I become. What am I?", a: "hole" },
  { q: "I go up but never come down. What am I?", a: "age" },
  { q: "What begins with an E, ends with an E, but only contains one letter?", a: "envelope" },
  { q: "I have a tail and a head, but no body. What am I?", a: "coin" },
  { q: "What can travel around the world while staying in a corner?", a: "stamp" },
  { q: "I'm tall when I'm young, and I'm short when I'm old. What am I?", a: "candle" },
  { q: "What has 13 hearts but no other organs?", a: "deck of cards" },
  { q: "I can be cracked, made, told, and played. What am I?", a: "joke" },
];

const command: CommandDefinition = {
  name: "riddle",
  description: "Sagutin ang isang random na riddle",
  category: "Games",
  access: "general",
  guildOnly: true,
  cooldown: 10,
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    const hintChar = riddle.a[0].toUpperCase();
    const blanks = riddle.a.replace(/[a-z]/g, "\_").replace(/\s/g, " ");

    const embed = baseEmbed("primary")
      .setTitle("🧩 Riddle Challenge")
      .setDescription(`> ${riddle.q}`)
      .addFields(
        { name: "Hint", value: `Starts with **${hintChar}** · ${riddle.a.length} letters \`${blanks}\``, inline: true },
        { name: "Time Limit", value: "60 seconds", inline: true },
      )
      .setFooter({ text: "Type your answer in chat!" });

    const revealBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("riddle:reveal").setLabel("Reveal Answer").setStyle(ButtonStyle.Secondary),
    );

    const msg = await ctx.reply({ embeds: [embed], components: [revealBtn], fetchReply: true });
    if (!msg) return;

    const channel = ctx.message?.channel ?? ctx.interaction?.channel;
    if (!channel?.isTextBased()) return;

    let answered = false;

    const msgCollector = (channel as any).createMessageCollector({
      filter: (m: any) => m.author.id === ctx.userId && !m.author.bot,
      time: 60_000,
    });

    const btnCollector = (msg as any).createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i: any) => i.user.id === ctx.userId && i.customId === "riddle:reveal",
      time: 60_000,
    });

    msgCollector.on("collect", async (m: any) => {
      const guess = m.content.trim().toLowerCase();
      const correct = riddle.a.toLowerCase().split(/\s|,/).some((w) => guess.includes(w));
      if (correct) {
        answered = true;
        msgCollector.stop();
        btnCollector.stop();
        await (msg as any).edit({ embeds: [successEmbed(`✅ Tama! Ang sagot ay **${riddle.a}**! 🎉`)], components: [] });
      }
    });

    btnCollector.on("collect", async (i: any) => {
      answered = true;
      msgCollector.stop();
      btnCollector.stop();
      await i.update({ embeds: [baseEmbed("danger").setTitle("🧩 Riddle Revealed").setDescription(`> ${riddle.q}\n\n**Answer: ${riddle.a}**`)], components: [] });
    });

    msgCollector.on("end", async () => {
      if (!answered) {
        btnCollector.stop();
        await (msg as any).edit({ embeds: [errorEmbed(`Time's up! Ang sagot ay **${riddle.a}**.`)], components: [] }).catch(() => {});
      }
    });
  },
};

export default command;
