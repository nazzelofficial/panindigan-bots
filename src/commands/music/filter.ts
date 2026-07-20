import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { createFilterUIEmbed, createFilterSelectMenu } from "../../features/music/embeds/musicEmbeds.js";

const FILTERS: Record<string, { label: string; desc: string; preset: object }> = {
  none: { label: "No Filter", desc: "Default — walang filter", preset: {} },
  bassboost: {
    label: "Bass Boost 🔊",
    desc: "Nag-a-amplify ng bass frequencies",
    preset: {
      equalizer: [
        { band: 0, gain: 0.3 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.2 },
        { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 },
      ],
    },
  },
  nightcore: {
    label: "Nightcore 🌙",
    desc: "Mas mabilis at mas mataas ang pitch",
    preset: { timescale: { speed: 1.25, pitch: 1.3, rate: 1.0 } },
  },
  vaporwave: {
    label: "Vaporwave 🌊",
    desc: "Mas mabagal at mas mababang pitch",
    preset: { timescale: { speed: 0.8, pitch: 0.85, rate: 1.0 } },
  },
  karaoke: {
    label: "Karaoke 🎤",
    desc: "Sinisipsip ang vocals",
    preset: { karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 } },
  },
  rotation: {
    label: "8D Audio 🎧",
    desc: "Umiikot ang audio para sa 8D effect",
    preset: { rotation: { rotationHz: 0.2 } },
  },
  tremolo: {
    label: "Tremolo 〰️",
    desc: "Nagdadagdag ng tremolo effect",
    preset: { tremolo: { frequency: 4.0, depth: 0.75 } },
  },
  vibrato: {
    label: "Vibrato 🎵",
    desc: "Nagdadagdag ng vibrato effect",
    preset: { vibrato: { frequency: 4.0, depth: 0.75 } },
  },
  slowdown: {
    label: "Slow Down 🐢",
    desc: "Mas mabagal ang bilis, hindi nagbabago ng pitch",
    preset: { timescale: { speed: 0.7, pitch: 1.0, rate: 1.0 } },
  },
  speedup: {
    label: "Speed Up ⚡",
    desc: "Mas mabilis ang bilis, hindi nagbabago ng pitch",
    preset: { timescale: { speed: 1.3, pitch: 1.0, rate: 1.0 } },
  },
};

const command: CommandDefinition = {
  name: "filter",
  description: "Apply an audio filter to the current track",
  category: "Music",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  aliases: ["filters", "fx"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s
          .setName("set")
          .setDescription("Apply a filter")
          .addStringOption((o) =>
            o.setName("filter").setDescription("Filter na ia-apply").setRequired(true)
              .addChoices(...Object.entries(FILTERS).map(([k, v]) => ({ name: v.label, value: k }))),
          ),
      )
      .addSubcommand((s) => s.setName("list").setDescription("View all available na filters"))
      .addSubcommand((s) => s.setName("clear").setDescription("Remove lahat ng aktibong filters")),
  async execute(ctx) {
    const validationError = validateMusicOperation(ctx.client);
    if (validationError) {
      await ctx.reply({ embeds: [errorEmbed(validationError)] });
      return;
    }
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const lava = (ctx.client as any).lavalink;
    if (!lava) { await ctx.reply({ embeds: [errorEmbed("Hindi available ang music system.")] }); return; }

    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : (ctx.args[0] ?? "list").toLowerCase();

    if (sub === "list") {
      const activeFilters: string[] = [];
      const embed = createFilterUIEmbed(activeFilters);
      const selectMenu = createFilterSelectMenu();
      await ctx.reply({ embeds: [embed], components: selectMenu ? [selectMenu] : [] });
      return;
    }

    const player = lava.getPlayer?.(guild.id);
    if (!player?.playing) { await ctx.reply({ embeds: [errorEmbed("No track is currently playing.")] }); return; }

    if (sub === "clear") {
      if (typeof player.setFilters === "function") await player.setFilters({});
      await ctx.reply({ embeds: [errorEmbed("🎛️ All audio filters have been cleared.")] });
      return;
    }

    const filterKey = ctx.isSlash ? ctx.interaction!.options.getString("filter", true) : ctx.args[1];
    if (!filterKey || !FILTERS[filterKey]) {
      await ctx.reply({ embeds: [errorEmbed("Invalid filter. Use `/filter list` to see available filters.")] });
      return;
    }

    const { label, preset } = FILTERS[filterKey];
    if (typeof player.setFilters === "function") await player.setFilters(preset);

    await ctx.reply({ embeds: [errorEmbed(`🎛️ Filter applied: **${label}**`)] });
  },
};

export default command;
