import { errorEmbed } from "../../utils/embeds.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";
const command = {
    name: "disconnect",
    description: "Disconnect the bot from the voice channel",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["leave", "dc"],
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
        const lava = ctx.client.lavalink;
        if (!lava) {
            await ctx.reply({ embeds: [errorEmbed("Hindi available ang music system.")] });
            return;
        }
        const player = lava.getPlayer?.(guild.id);
        if (!player) {
            // Fallback: disconnect via voice adapter
            const vc = guild.voiceStates.cache.get(ctx.client.user.id)?.channel;
            if (!vc) {
                await ctx.reply({ embeds: [errorEmbed("The bot is not connected to any voice channel.")] });
                return;
            }
            guild.members.me?.voice.disconnect().catch(() => { });
            await ctx.reply({ embeds: [errorEmbed("👋 The bot has been disconnected from the voice channel.")] });
            return;
        }
        const result = await MusicService.disconnect(player);
        await ctx.reply({ embeds: [result.success ? errorEmbed("👋 The bot has left the voice channel.") : errorEmbed(result.message)] });
    },
};
export default command;
//# sourceMappingURL=disconnect.js.map