import { ButtonStyle, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { baseEmbed, errorEmbed, infoEmbed } from "../../utils/embeds";
const command = {
    name: "controls",
    description: "Show interactive music player controls",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["player", "music"],
    async execute(ctx) {
        if (!ctx.client.lavalink) {
            await ctx.reply({ embeds: [errorEmbed("Music is not configured. Set LAVALINK_HOST, LAVALINK_PORT, and LAVALINK_PASSWORD.")] });
            return;
        }
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const player = ctx.client.lavalink.players?.get(guild.id);
        if (!player) {
            await ctx.reply({ embeds: [infoEmbed("No active music player in this server. Use `/play` to start.")] });
            return;
        }
        const track = player.queue?.current;
        const paused = player.paused;
        const volume = player.volume ?? 100;
        const embed = baseEmbed("primary")
            .setTitle("🎵 Music Player")
            .setDescription(track ? `**${track.title}**\nby ${track.author ?? "Unknown"}` : "No track playing")
            .addFields({ name: "Status", value: paused ? "⏸️ Paused" : "▶️ Playing", inline: true }, { name: "Volume", value: `🔊 ${volume}%`, inline: true }, { name: "Queue", value: `${player.queue?.tracks?.length ?? 0} track(s) queued`, inline: true });
        const row1 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("music:previous").setEmoji("⏮️").setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId("music:pause").setEmoji(paused ? "▶️" : "⏸️").setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId("music:skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId("music:stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger));
        const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("music:voldown").setEmoji("🔉").setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId("music:volup").setEmoji("🔊").setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId("music:shuffle").setEmoji("🔀").setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId("music:loop").setEmoji("🔁").setStyle(ButtonStyle.Secondary));
        await ctx.reply({ embeds: [embed], components: [row1, row2] });
    },
    registerComponents(client) {
        client.componentHandlers.set("music", async (interaction) => {
            if (!interaction.isButton())
                return;
            if (!client.lavalink) {
                await interaction.reply({ content: "Music not configured.", ephemeral: true });
                return;
            }
            const guild = interaction.guild;
            if (!guild)
                return;
            const player = client.lavalink.players?.get(guild.id);
            if (!player) {
                await interaction.reply({ content: "No active player.", ephemeral: true });
                return;
            }
            const action = interaction.customId.split(":")[1];
            switch (action) {
                case "pause":
                    await player.pause(!player.paused);
                    await interaction.reply({ content: player.paused ? "⏸️ Paused" : "▶️ Resumed", ephemeral: true });
                    break;
                case "skip":
                    await player.skip();
                    await interaction.reply({ content: "⏭️ Skipped", ephemeral: true });
                    break;
                case "stop":
                    await player.destroy();
                    await interaction.reply({ content: "⏹️ Stopped and left the channel.", ephemeral: true });
                    break;
                case "volup":
                    await player.setVolume(Math.min(200, player.volume + 10));
                    await interaction.reply({ content: `🔊 Volume: ${player.volume}%`, ephemeral: true });
                    break;
                case "voldown":
                    await player.setVolume(Math.max(0, player.volume - 10));
                    await interaction.reply({ content: `🔉 Volume: ${player.volume}%`, ephemeral: true });
                    break;
                case "shuffle":
                    player.queue?.shuffle?.();
                    await interaction.reply({ content: "🔀 Queue shuffled", ephemeral: true });
                    break;
                case "loop":
                    player.setRepeatMode?.(player.repeatMode === "track" ? "off" : "track");
                    await interaction.reply({ content: `🔁 Loop: ${player.repeatMode ?? "off"}`, ephemeral: true });
                    break;
                case "previous":
                    await interaction.reply({ content: "⏮️ Previous track not supported by the current player.", ephemeral: true });
                    break;
                default:
                    await interaction.reply({ content: "Unknown action.", ephemeral: true });
            }
        });
    },
};
export default command;
//# sourceMappingURL=controls.js.map