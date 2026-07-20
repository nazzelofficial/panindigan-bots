import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";

const LOOP_MODES = ["off", "track", "queue"] as const;
type LoopMode = typeof LOOP_MODES[number];

const command: CommandDefinition = {
  name: "loop",
  description: "Toggle loop mode: off / track / queue",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 3,
  aliases: ["repeat"],
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) =>
      o.setName("mode").setDescription("Loop mode").setRequired(false)
        .addChoices(
          { name: "Off", value: "off" },
          { name: "Track (repeat current song)", value: "track" },
          { name: "Queue (repeat whole queue)", value: "queue" },
        ),
    ),
  async execute(ctx) {
    const validationError = validateMusicOperation(ctx.client);
    if (validationError) {
      await ctx.reply({ embeds: [errorEmbed(validationError)] });
      return;
    }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const lava = (ctx.client as any).lavalink;
    if (!lava) { await ctx.reply({ embeds: [errorEmbed("Hindi available ang music system sa ngayon.")] }); return; }

    const player = lava.getPlayer?.(guild.id);
    if (!player) { await ctx.reply({ embeds: [errorEmbed("No active music player.")] }); return; }

    const modeArg = (ctx.isSlash ? ctx.interaction!.options.getString("mode") : ctx.args[0]?.toLowerCase()) as LoopMode | null;

    let current: LoopMode = (player.repeatMode as LoopMode) ?? "off";

    let next: LoopMode;
    if (modeArg && LOOP_MODES.includes(modeArg)) {
      next = modeArg;
    } else {
      // Cycle: off → track → queue → off
      const idx = LOOP_MODES.indexOf(current);
      next = LOOP_MODES[(idx + 1) % LOOP_MODES.length];
    }

    const result = await MusicService.setLoopMode(player, next);

    const labels: Record<LoopMode, string> = {
      off: "🔁 Loop **OFF**",
      track: "🔂 Loop **TRACK** — paulit-ulit ang current track",
      queue: "🔁 Loop **QUEUE** — paulit-ulit ang full queue",
    };

    await ctx.reply({ embeds: [errorEmbed(labels[next as LoopMode])] });
  },
};

export default command;
