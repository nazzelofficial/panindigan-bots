import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds";
const command = {
    name: "volume",
    description: "I-adjust ang volume ng music player (0-200)",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
    aliases: ["vol"],
    slashData: (b) => b.addIntegerOption((o) => o.setName("level").setDescription("Volume level (0–200). Leave blank to view current volume.").setRequired(false).setMinValue(0).setMaxValue(200)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const lava = ctx.client.lavalink;
        if (!lava) {
            await ctx.reply({ embeds: [errorEmbed("Hindi available ang music system sa ngayon.")] });
            return;
        }
        const player = lava.getPlayer?.(guild.id);
        if (!player) {
            await ctx.reply({ embeds: [errorEmbed("No active music player. Start one with `/play`.")] });
            return;
        }
        const levelStr = ctx.isSlash
            ? ctx.interaction.options.getInteger("level")
            : ctx.args[0] ? parseInt(ctx.args[0]) : null;
        if (levelStr === null || levelStr === undefined) {
            const current = player.volume ?? 100;
            const bar = buildVolumeBar(current);
            await ctx.reply({
                embeds: [
                    baseEmbed("primary")
                        .setTitle("🔊 Current Volume")
                        .setDescription(`${bar}\n**${current}%**`),
                ],
            });
            return;
        }
        const level = typeof levelStr === "number" ? levelStr : parseInt(String(levelStr));
        if (isNaN(level) || level < 0 || level > 200) {
            await ctx.reply({ embeds: [errorEmbed("Volume ay dapat between **0** at **200**.")] });
            return;
        }
        await player.setVolume(level);
        const bar = buildVolumeBar(level);
        const emoji = level === 0 ? "🔇" : level < 50 ? "🔈" : level < 100 ? "🔉" : "🔊";
        await ctx.reply({
            embeds: [
                successEmbed(`${emoji} Volume set to **${level}%**\n${bar}`),
            ],
        });
    },
};
function buildVolumeBar(level) {
    const filled = Math.round(level / 20); // 0-10 blocks (200 max)
    const capped = Math.min(filled, 10);
    return "▓".repeat(capped) + "░".repeat(10 - capped);
}
export default command;
//# sourceMappingURL=volume.js.map