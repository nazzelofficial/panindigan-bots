import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
const command = {
    name: "queuemove",
    description: "Move a track from one position to another in the queue",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["qmove", "movesong"],
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("from").setDescription("Current position (1-based)").setRequired(true).setMinValue(1))
        .addIntegerOption((o) => o.setName("to").setDescription("Target position (1-based)").setRequired(true).setMinValue(1)),
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
        if (!player) {
            await ctx.reply({ embeds: [errorEmbed("No active music player.")] });
            return;
        }
        const from = ctx.isSlash ? ctx.interaction.options.getInteger("from", true) : (parseInt(ctx.args[0] ?? "0") || 0);
        const to = ctx.isSlash ? ctx.interaction.options.getInteger("to", true) : (parseInt(ctx.args[1] ?? "0") || 0);
        const tracks = player.queue?.tracks ?? [];
        if (from < 1 || from > tracks.length || to < 1 || to > tracks.length) {
            await ctx.reply({ embeds: [errorEmbed(`Invalid positions. Queue has **${tracks.length}** track${tracks.length !== 1 ? "s" : ""}.`)] });
            return;
        }
        const [moved] = tracks.splice(from - 1, 1);
        tracks.splice(to - 1, 0, moved);
        const title = moved?.info?.title ?? moved?.title ?? `Track #${from}`;
        await ctx.reply({ embeds: [successEmbed(`✅ Moved **${title}** from position **#${from}** to **#${to}**.`)] });
    },
};
export default command;
//# sourceMappingURL=queueMove.js.map