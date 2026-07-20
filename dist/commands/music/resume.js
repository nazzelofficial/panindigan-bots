import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";
const command = {
    name: "resume",
    description: "Resume paused music",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
    aliases: ["unpause", "res"],
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
            await ctx.reply({ embeds: [errorEmbed("No active music player.")] });
            return;
        }
        if (!player.paused) {
            await ctx.reply({ embeds: [errorEmbed("Music is not paused.")] });
            return;
        }
        const result = await MusicService.resume(player);
        await ctx.reply({ embeds: [result.success ? errorEmbed("▶️ Music resumed.") : errorEmbed(result.message)] });
    },
};
export default command;
//# sourceMappingURL=resume.js.map