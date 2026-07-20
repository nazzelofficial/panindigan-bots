import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { baseEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "queue",
  description: "View the current music queue",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["q"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addIntegerOption((o) => o.setName("page").setDescription("Page number").setRequired(false).setMinValue(1)),
  async execute(ctx) {
    if (!ctx.client.lavalink) {
      await ctx.reply({ embeds: [errorEmbed("Music is not configured.")] });
      return;
    }

    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const player = (ctx.client.lavalink as any).players?.get(guild.id);
    if (!player) {
      await ctx.reply({ embeds: [infoEmbed("No active music player.")] });
      return;
    }

    const current = player.queue?.current;
    const tracks: any[] = player.queue?.tracks ?? [];
    const page = Math.max(1, ctx.isSlash ? (ctx.interaction!.options.getInteger("page") ?? 1) : (parseInt(ctx.args[0] ?? "1") || 1));
    const perPage = 10;
    const skip = (page - 1) * perPage;
    const totalPages = Math.max(1, Math.ceil(tracks.length / perPage));

    function formatMs(ms: number): string {
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      return `${m}:${(s % 60).toString().padStart(2, "0")}`;
    }

    const embed = baseEmbed("primary")
      .setTitle(`🎵 Music Queue — Page ${page}/${totalPages}`)
      .addFields({ name: "🎶 Now Playing", value: current ? `**${current.title}** (${formatMs(current.duration ?? 0)})` : "Nothing", inline: false });

    if (tracks.length === 0) {
      embed.addFields({ name: "Queue", value: "The queue is empty.", inline: false });
    } else {
      const pageItems = tracks.slice(skip, skip + perPage);
      embed.addFields({
        name: `Queue (${tracks.length} track${tracks.length !== 1 ? "s" : ""})`,
        value: pageItems.map((t, i) => `**${skip + i + 1}.** ${t.title} (${formatMs(t.duration ?? 0)})`).join("\n"),
        inline: false,
      });
    }

    const totalDuration = tracks.reduce((a, t) => a + (t.duration ?? 0), 0);
    embed.setFooter({ text: `Total queue duration: ${formatMs(totalDuration)} · ${tracks.length} tracks` });
    await ctx.reply({ embeds: [embed] });
  },
};

export default command;
