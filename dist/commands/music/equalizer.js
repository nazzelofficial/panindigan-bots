import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
const EQ_PRESETS = {
    flat: { label: "Flat", bands: Array.from({ length: 15 }, (_, i) => ({ band: i, gain: 0 })) },
    bass: { label: "Bass Boost", bands: [{ band: 0, gain: 0.3 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.2 }, { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 }, ...Array.from({ length: 10 }, (_, i) => ({ band: i + 5, gain: 0 }))] },
    treble: { label: "Treble", bands: [...Array.from({ length: 10 }, (_, i) => ({ band: i, gain: 0 })), { band: 10, gain: 0.1 }, { band: 11, gain: 0.2 }, { band: 12, gain: 0.25 }, { band: 13, gain: 0.3 }, { band: 14, gain: 0.3 }] },
    vocal: { label: "Vocal Boost", bands: [{ band: 0, gain: -0.1 }, { band: 1, gain: -0.05 }, { band: 2, gain: 0.1 }, { band: 3, gain: 0.2 }, { band: 4, gain: 0.2 }, { band: 5, gain: 0.2 }, { band: 6, gain: 0.15 }, { band: 7, gain: 0.1 }, { band: 8, gain: 0.05 }, ...Array.from({ length: 6 }, (_, i) => ({ band: i + 9, gain: -0.05 }))] },
    electronic: { label: "Electronic", bands: [{ band: 0, gain: 0.25 }, { band: 1, gain: 0.25 }, ...Array.from({ length: 8 }, (_, i) => ({ band: i + 2, gain: 0 })), { band: 10, gain: 0.15 }, { band: 11, gain: 0.2 }, { band: 12, gain: 0.2 }, { band: 13, gain: 0.15 }, { band: 14, gain: 0.1 }] },
    rock: { label: "Rock", bands: [{ band: 0, gain: 0.2 }, { band: 1, gain: 0.15 }, { band: 2, gain: 0.05 }, { band: 3, gain: 0 }, { band: 4, gain: 0 }, { band: 5, gain: 0.1 }, { band: 6, gain: 0.2 }, { band: 7, gain: 0.2 }, { band: 8, gain: 0.15 }, { band: 9, gain: 0.1 }, { band: 10, gain: 0.1 }, { band: 11, gain: 0.15 }, { band: 12, gain: 0.15 }, { band: 13, gain: 0.1 }, { band: 14, gain: 0.1 }] },
    pop: { label: "Pop", bands: [{ band: 0, gain: -0.05 }, { band: 1, gain: 0 }, { band: 2, gain: 0.1 }, { band: 3, gain: 0.15 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0 }, { band: 6, gain: -0.05 }, { band: 7, gain: -0.1 }, { band: 8, gain: -0.05 }, { band: 9, gain: 0 }, { band: 10, gain: 0.1 }, { band: 11, gain: 0.1 }, { band: 12, gain: 0.05 }, { band: 13, gain: 0 }, { band: 14, gain: 0 }] },
    classical: { label: "Classical", bands: [{ band: 0, gain: 0.1 }, { band: 1, gain: 0.1 }, { band: 2, gain: 0 }, { band: 3, gain: 0 }, { band: 4, gain: 0 }, { band: 5, gain: 0 }, { band: 6, gain: 0 }, { band: 7, gain: 0 }, { band: 8, gain: 0 }, { band: 9, gain: 0 }, { band: 10, gain: 0 }, { band: 11, gain: 0 }, { band: 12, gain: 0.1 }, { band: 13, gain: 0.15 }, { band: 14, gain: 0.15 }] },
};
const command = {
    name: "equalizer",
    description: "Apply an equalizer preset to the music",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["eq"],
    slashData: (b) => b.addStringOption((o) => o.setName("preset").setDescription("EQ preset to apply").setRequired(true)
        .addChoices(...Object.entries(EQ_PRESETS).map(([k, v]) => ({ name: v.label, value: k })))),
    async execute(ctx) {
        const validationError = validateMusicOperation(ctx.client);
        if (validationError) {
            await ctx.reply({ embeds: [errorEmbed(validationError)] });
            return;
        }
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const player = ctx.client.lavalink.getPlayer?.(guild.id);
        if (!player?.playing && !player?.paused) {
            await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] });
            return;
        }
        const key = ctx.isSlash ? ctx.interaction.options.getString("preset", true) : (ctx.args[0] ?? "flat");
        const preset = EQ_PRESETS[key];
        if (!preset) {
            await ctx.reply({ embeds: [errorEmbed(`Unknown preset. Choose from: ${Object.keys(EQ_PRESETS).join(", ")}`)] });
            return;
        }
        await player.setFilters?.({ equalizer: preset.bands });
        await ctx.reply({ embeds: [successEmbed(`🎚️ Equalizer set to **${preset.label}** preset.`)] });
    },
};
export default command;
//# sourceMappingURL=equalizer.js.map