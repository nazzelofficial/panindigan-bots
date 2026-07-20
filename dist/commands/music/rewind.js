import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
const command = {
    name: "rewind",
    description: "Seek backward in the current song",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
    aliases: ["rw", "rew"],
    slashData: (b) => b.addIntegerOption((o) => o.setName("seconds").setDescription("Seconds to rewind (default: 10)").setRequired(false).setMinValue(1).setMaxValue(600)),
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
        const seconds = ctx.isSlash
            ? (ctx.interaction.options.getInteger("seconds") ?? 10)
            : (parseInt(ctx.args[0] ?? "10") || 10);
        const current = player.position ?? 0;
        const next = Math.max(0, current - seconds * 1000);
        await player.seek?.(next);
        await ctx.reply({ embeds: [successEmbed(`⏪ Rewound **${seconds}s**.`)] });
    },
};
export default command;
//# sourceMappingURL=rewind.js.map