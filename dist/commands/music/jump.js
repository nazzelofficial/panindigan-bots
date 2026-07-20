import { successEmbed, errorEmbed } from "../../utils/embeds.js";
function fmtTime(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
}
const command = {
    name: "jump",
    description: "Jump to a specific time in the current song",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
    aliases: ["seek", "goto"],
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("minutes").setDescription("Minutes").setRequired(false).setMinValue(0))
        .addIntegerOption((o) => o.setName("seconds").setDescription("Seconds").setRequired(false).setMinValue(0).setMaxValue(59)),
    async execute(ctx) {
        if (!ctx.client.lavalink) {
            await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] });
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
        let totalSeconds;
        if (ctx.isSlash) {
            const mins = ctx.interaction.options.getInteger("minutes") ?? 0;
            const secs = ctx.interaction.options.getInteger("seconds") ?? 0;
            totalSeconds = mins * 60 + secs;
        }
        else {
            // Parse "1:30" or "90"
            const raw = ctx.args[0] ?? "0";
            if (raw.includes(":")) {
                const [m, s] = raw.split(":").map(Number);
                totalSeconds = (m || 0) * 60 + (s || 0);
            }
            else {
                totalSeconds = parseInt(raw) || 0;
            }
        }
        await player.seek?.(totalSeconds * 1000);
        await ctx.reply({ embeds: [successEmbed(`⏩ Jumped to **${fmtTime(totalSeconds)}**.`)] });
    },
};
export default command;
//# sourceMappingURL=jump.js.map