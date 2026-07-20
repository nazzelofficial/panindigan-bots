import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";
import { createQueueEmbed, createQueueNavigationButtons } from "../../features/music/embeds/musicEmbeds.js";
const command = {
    name: "queue",
    description: "View the current music queue",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["q"],
    slashData: (b) => b.addIntegerOption((o) => o.setName("page").setDescription("Page number").setRequired(false).setMinValue(1)),
    async execute(ctx) {
        const validationError = validateMusicOperation(ctx.client);
        if (validationError) {
            await ctx.reply({ embeds: [errorEmbed(validationError)] });
            return;
        }
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const player = ctx.client.lavalink.players?.get(guild.id);
        if (!player) {
            await ctx.reply({ embeds: [errorEmbed("No active music player.")] });
            return;
        }
        const queueInfo = MusicService.getQueue(player);
        const page = Math.max(1, ctx.isSlash ? (ctx.interaction.options.getInteger("page") ?? 1) : (parseInt(ctx.args[0] ?? "1") || 1));
        const embed = createQueueEmbed(player.queue, page);
        const buttons = createQueueNavigationButtons(page, Math.max(1, Math.ceil(queueInfo.tracks.length / 10)));
        await ctx.reply({ embeds: [embed], components: buttons ? [buttons] : [] });
    },
};
export default command;
//# sourceMappingURL=queue.js.map