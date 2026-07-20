import { successEmbed, errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
const command = {
    name: "pause",
    description: "Pause the current song",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
    aliases: ["pa"],
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
        if (!player?.playing) {
            await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] });
            return;
        }
        if (player.paused) {
            await ctx.reply({ embeds: [errorEmbed("Music is already paused.")] });
            return;
        }
        await player.pause?.();
        await ctx.reply({ embeds: [successEmbed("⏸️ Music paused. Use `/resume` to continue.")] });
    },
};
export default command;
//# sourceMappingURL=pause.js.map