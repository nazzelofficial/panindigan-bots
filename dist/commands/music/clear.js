import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";
const command = {
    name: "clear",
    description: "Clear the music queue (keeps current song playing)",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["clearqueue", "qclear"],
    slashData: (b) => b,
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
            await ctx.reply({ embeds: [errorEmbed("No active music queue.")] });
            return;
        }
        const result = await MusicService.clearQueue(player);
        await ctx.reply({ embeds: [result.success ? errorEmbed(result.message) : errorEmbed(result.message)] });
    },
};
export default command;
//# sourceMappingURL=clear.js.map