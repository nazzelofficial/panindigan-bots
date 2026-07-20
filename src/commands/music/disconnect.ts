import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";

const command: CommandDefinition = {
  name: "disconnect",
  description: "Disconnect the bot from the voice channel",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["leave", "dc"],
  slashData: (b) => b as SlashCommandBuilder,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const lava = (ctx.client as any).lavalink;
    if (!lava) { await ctx.reply({ embeds: [errorEmbed("Hindi available ang music system.")] }); return; }

    const player = lava.getPlayer?.(guild.id);
    if (!player) {
      // Fallback: disconnect via voice adapter
      const vc = guild.voiceStates.cache.get(ctx.client.user!.id)?.channel;
      if (!vc) { await ctx.reply({ embeds: [errorEmbed("The bot is not connected to any voice channel.")] }); return; }
      guild.members.me?.voice.disconnect().catch(() => {});
      await ctx.reply({ embeds: [successEmbed("👋 The bot has been disconnected from the voice channel.")] });
      return;
    }

    if (player.queue && typeof player.queue.clear === "function") player.queue.clear();
    if (typeof player.destroy === "function") await player.destroy();

    await ctx.reply({ embeds: [successEmbed("👋 The bot has left the voice channel.")] });
  },
};

export default command;
