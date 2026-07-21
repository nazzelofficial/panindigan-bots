import { EmbedFactory } from "../../structures/EmbedFactory.js";
import { validateMusicOperation } from "../../utils/music.js";
import { MusicService } from "../../services/MusicService.js";
function getMusicUnavailableEmbed() {
    return EmbedFactory.error("❌ Music service is currently unavailable.\nThe Lavalink server is offline or unreachable.\nPlease try again later.");
}
const command = {
    name: "play",
    description: "Play a song or playlist from a URL or search query",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
    aliases: ["p"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("query").setDescription("Song name or URL").setRequired(true).setAutocomplete(true)),
    async autocomplete(interaction, client) {
        const query = String(interaction.options.getFocused() ?? "").trim();
        if (!query || query.length < 2) {
            await interaction.respond([{ name: "Type a song name or URL to search…", value: "lofi chill beats" }]);
            return;
        }
        const lava = client.lavalink;
        if (!lava) {
            await interaction.respond([]);
            return;
        }
        try {
            // lavalink-client exposes search on the manager directly
            const result = await (lava.search
                ? lava.search({ query, source: "ytsearch" }, client.user)
                : lava.getPlayer(interaction.guildId)?.search?.({ query, source: "ytsearch" }, client.user)).catch(() => null);
            const tracks = result?.tracks ?? [];
            await interaction.respond(tracks.slice(0, 10).map((t) => ({
                name: `${t.info.title} — ${t.info.author}`.slice(0, 100),
                value: (t.info.uri ?? t.info.title).slice(0, 100),
            })));
        }
        catch {
            await interaction.respond([]);
        }
    },
    async execute(ctx) {
        const validationError = validateMusicOperation(ctx.client);
        if (validationError) {
            await ctx.reply({ embeds: [EmbedFactory.error(validationError)] });
            return;
        }
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        const member = ctx.interaction?.member ?? ctx.message?.member;
        if (!guild || !member)
            return;
        const voiceChannelId = member.voice?.channelId;
        if (!voiceChannelId) {
            await ctx.reply({ embeds: [EmbedFactory.error("You need to be in a voice channel to use music commands.")] });
            return;
        }
        const query = ctx.isSlash ? ctx.interaction.options.getString("query", true) : ctx.args.join(" ");
        if (!query) {
            await ctx.reply({ embeds: [EmbedFactory.error("Provide a song name or URL.")] });
            return;
        }
        const textChannelId = ctx.interaction?.channelId ?? ctx.message?.channelId;
        // Defer slash command
        if (ctx.isSlash) {
            await ctx.interaction.deferReply();
        }
        const result = await MusicService.play({
            guild,
            voiceChannelId,
            textChannelId: textChannelId,
            query,
            userId: ctx.userId,
            client: ctx.client,
            isSlash: ctx.isSlash,
            interaction: ctx.interaction,
            message: ctx.message,
        });
        if (!result.success) {
            await ctx.reply({ embeds: [EmbedFactory.error(result.message)] });
        }
    },
};
function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return h > 0
        ? `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
        : `${m}:${String(s % 60).padStart(2, "0")}`;
}
export default command;
//# sourceMappingURL=play.js.map