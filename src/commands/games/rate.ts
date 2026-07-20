import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";

function getReview(score: number): string {
  if (score === 100) return "PERFECT! Wala nang mas magaling pa dito! 🏆";
  if (score >= 90) return "Sobrang ganda! Elite talaga. 🌟";
  if (score >= 80) return "Napakaganda! Highly recommended. ✨";
  if (score >= 70) return "Maganda! Worth it. 👍";
  if (score >= 60) return "Medyo maganda. Pwede na. 😊";
  if (score >= 50) return "Average. Hindi masama, hindi rin kahanga-hanga. 🤷";
  if (score >= 40) return "Medyo mababa. May room for improvement. 😬";
  if (score >= 30) return "Hindi masyadong maganda. Kailangan pang mapabuti. 😅";
  if (score >= 20) return "Mahirap aminin, pero hindi ganoon kaganda. 😬";
  if (score >= 10) return "Oops. Malayo pa sa expected. 😂";
  if (score === 0) return "Zero. Talaga? TALAGA?? 💀";
  return "Baka may mabago pa? 🙂";
}

function buildStars(score: number): string {
  const stars = Math.round(score / 20);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars);
}

const command: CommandDefinition = {
  name: "rate",
  description: "The bot gives a random rating to anything — just for fun!",
  category: "Games",
  access: "general",
  guildOnly: false,
  cooldown: 3,
  aliases: ["rateit", "score"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("item").setDescription("Ano ang ire-rate? (pwede pangalan, bagay, ideya, atbp.)").setRequired(true),
    ),
  async execute(ctx) {
    const item = ctx.isSlash ? ctx.interaction!.options.getString("item", true) : ctx.args.join(" ");
    if (!item) { await ctx.reply({ embeds: [errorEmbed("Provide a isang bagay na ire-rate.")] }); return; }
    if (item.length > 100) { await ctx.reply({ embeds: [errorEmbed("Maximum ng 100 characters lang ang item.")] }); return; }

    // Deterministic based on item + today's date for consistency
    const seed = item.toLowerCase() + new Date().toDateString();
    let hash = 5381;
    for (let i = 0; i < seed.length; i++) hash = (hash * 33 + seed.charCodeAt(i)) & 0xffffffff;
    const score = Math.abs(hash) % 101;

    const stars = buildStars(score);
    const review = getReview(score);

    const embed = baseEmbed("primary")
      .setTitle("⭐ Rate-O-Meter")
      .addFields(
        { name: "Item", value: `**${item}**`, inline: false },
        { name: "Rating", value: `${stars} **${score}/100**`, inline: false },
        { name: "Verdict", value: review, inline: false },
      )
      .setFooter({ text: "Para sa saya lang — walang seryoso! 😄" });

    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
