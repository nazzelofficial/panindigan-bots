import { successEmbed, errorEmbed } from "@/utils/embeds";
import { SavedQueueModel } from "@/database/models/Community";
const command = {
    name: "savedqueueload",
    description: "Load a previously saved queue",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    aliases: ["loadqueue", "qload"],
    slashData: (b) => b.addStringOption((o) => o.setName("name").setDescription("Name of the saved queue to load").setRequired(true).setAutocomplete(true)),
    async autocomplete(interaction) {
        const focused = String(interaction.options.getFocused() ?? "").trim();
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        try {
            const filter = { guildId, userId };
            if (focused)
                filter["name"] = { $regex: focused, $options: "i" };
            const queues = await SavedQueueModel.find(filter).limit(25).lean();
            await interaction.respond(queues.map((q) => ({ name: String(q.name), value: String(q.name) })));
        }
        catch {
            await interaction.respond([]);
        }
    },
    async execute(ctx) {
        if (!ctx.client.lavalink) {
            await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] });
            return;
        }
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const member = ctx.interaction?.member ?? ctx.message?.member;
        const voiceChannelId = member?.voice?.channelId;
        if (!voiceChannelId) {
            await ctx.reply({ embeds: [errorEmbed("You need to be in a voice channel.")] });
            return;
        }
        const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args.join(" ");
        if (!name) {
            await ctx.reply({ embeds: [errorEmbed("Please provide the name of the saved queue.")] });
            return;
        }
        const saved = await SavedQueueModel.findOne({ guildId: guild.id, userId: ctx.userId, name }).lean();
        if (!saved) {
            await ctx.reply({ embeds: [errorEmbed(`No saved queue named **"${name}"** found.`)] });
            return;
        }
        const tracks = saved.tracks ?? [];
        if (tracks.length === 0) {
            await ctx.reply({ embeds: [errorEmbed("That saved queue is empty.")] });
            return;
        }
        let player = ctx.client.lavalink.getPlayer?.(guild.id);
        if (!player) {
            player = ctx.client.lavalink.createPlayer?.({
                guildId: guild.id, voiceChannelId,
                textChannelId: ctx.interaction?.channelId ?? ctx.message?.channelId,
                selfDeaf: true, selfMute: false, volume: 80,
            });
        }
        if (!player.connected)
            await player.connect?.();
        let added = 0;
        for (const t of tracks) {
            const result = await player.search?.({ query: t.uri || t.title, source: "ytsearch" }, ctx.client.user).catch(() => null);
            if (result?.tracks?.[0]) {
                player.queue?.add?.(result.tracks[0]);
                added++;
            }
        }
        if (!player.playing)
            await player.play?.().catch(() => { });
        await ctx.reply({ embeds: [successEmbed(`▶️ Loaded queue **"${name}"** — added **${added}** track${added !== 1 ? "s" : ""} and started playing.`)] });
    },
};
export default command;
//# sourceMappingURL=savedqueueLoad.js.map