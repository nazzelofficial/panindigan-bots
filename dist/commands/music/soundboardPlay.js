import { successEmbed, errorEmbed } from "../../utils/embeds";
import { GuildModel } from "../../database/models/Guild";
const command = {
    name: "soundboardplay",
    description: "Play a sound from the server soundboard",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["playsound", "sb"],
    slashData: (b) => b.addStringOption((o) => o.setName("name").setDescription("Name of the sound to play").setRequired(true)),
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
            await ctx.reply({ embeds: [errorEmbed("You need to be in a voice channel to use the soundboard.")] });
            return;
        }
        const name = (ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[0] ?? "").toLowerCase();
        const doc = await GuildModel.findOne({ guildId: guild.id }).lean();
        const sounds = doc?.soundboard ?? [];
        const sound = sounds.find((s) => s.name === name);
        if (!sound) {
            await ctx.reply({ embeds: [errorEmbed(`Sound **"${name}"** not found. Use \`/soundboardlist\` to see available sounds.`)] });
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
        if (!player?.connected)
            await player?.connect?.();
        const result = await player.search?.({ query: sound.url, source: "raw" }, ctx.client.user).catch(() => null);
        if (!result?.tracks?.[0]) {
            await ctx.reply({ embeds: [errorEmbed("Failed to load the sound. The URL may be invalid.")] });
            return;
        }
        player.queue?.add?.(result.tracks[0]);
        if (!player.playing)
            await player.play?.().catch(() => { });
        await ctx.reply({ embeds: [successEmbed(`🔊 Playing sound: **${sound.name}**`)] });
    },
};
export default command;
//# sourceMappingURL=soundboardPlay.js.map