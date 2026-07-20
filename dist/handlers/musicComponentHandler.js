import { scopedLogger } from "../utils/logger.js";
const log = scopedLogger("musicComponentHandler");
export function registerMusicComponentHandlers(client) {
    // Music control buttons
    client.componentHandlers.set("music", async (interaction) => {
        const parts = interaction.customId.split(":");
        const action = parts[1];
        if (!interaction.guildId)
            return;
        const player = client.lavalink.players?.get(interaction.guildId);
        if (!player) {
            await interaction.reply({ content: "No active music player.", ephemeral: true });
            return;
        }
        try {
            switch (action) {
                case "previous":
                    await player.skip?.();
                    await interaction.deferUpdate();
                    break;
                case "pause":
                    if (player.paused) {
                        await player.resume?.();
                    }
                    else {
                        await player.pause?.();
                    }
                    await interaction.deferUpdate();
                    break;
                case "skip":
                    await player.skip?.();
                    await interaction.deferUpdate();
                    break;
                case "stop":
                    if (player.queue && typeof player.queue.clear === "function")
                        player.queue.clear();
                    if (typeof player.stop === "function")
                        await player.stop();
                    await interaction.deferUpdate();
                    break;
                case "shuffle":
                    const tracks = player.queue?.tracks ?? [];
                    for (let i = tracks.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
                    }
                    await interaction.deferUpdate();
                    break;
                default:
                    await interaction.reply({ content: "Unknown action.", ephemeral: true });
            }
            log.info("Music button clicked", { action, userId: interaction.user.id, guildId: interaction.guildId });
        }
        catch (error) {
            log.error("Error handling music button", { action, error: String(error) });
            await interaction.reply({ content: "An error occurred.", ephemeral: true }).catch(() => { });
        }
    });
    // Queue navigation buttons
    client.componentHandlers.set("queue", async (interaction) => {
        // Queue navigation would require state management
        await interaction.reply({ content: "Queue navigation not yet implemented.", ephemeral: true });
    });
    // Search navigation buttons
    client.componentHandlers.set("search", async (interaction) => {
        // Search navigation would require state management
        await interaction.reply({ content: "Search navigation not yet implemented.", ephemeral: true });
    });
    // Lyrics navigation buttons
    client.componentHandlers.set("lyrics", async (interaction) => {
        const parts = interaction.customId.split(":");
        const action = parts[1];
        if (action === "close") {
            await interaction.message.delete().catch(() => { });
        }
        else {
            await interaction.reply({ content: "Lyrics navigation not yet implemented.", ephemeral: true });
        }
    });
    // Filter buttons
    client.componentHandlers.set("filter", async (interaction) => {
        const parts = interaction.customId.split(":");
        const filterType = parts[1];
        if (!interaction.guildId)
            return;
        const player = client.lavalink.players?.get(interaction.guildId);
        if (!player) {
            await interaction.reply({ content: "No active music player.", ephemeral: true });
            return;
        }
        try {
            switch (filterType) {
                case "bassboost":
                    await player.setFilters?.({
                        equalizer: [
                            { band: 0, gain: 0.3 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.2 },
                            { band: 3, gain: 0.1 }, { band: 4, gain: 0.05 },
                        ],
                    });
                    await interaction.deferUpdate();
                    break;
                case "nightcore":
                    await player.setFilters?.({ timescale: { speed: 1.25, pitch: 1.3, rate: 1.0 } });
                    await interaction.deferUpdate();
                    break;
                case "8d":
                    await player.setFilters?.({ rotation: { rotationHz: 0.2 } });
                    await interaction.deferUpdate();
                    break;
                case "vaporwave":
                    await player.setFilters?.({ timescale: { speed: 0.8, pitch: 0.85, rate: 1.0 } });
                    await interaction.deferUpdate();
                    break;
                case "clear":
                    await player.setFilters?.({});
                    await interaction.deferUpdate();
                    break;
                default:
                    await interaction.reply({ content: "Unknown filter.", ephemeral: true });
            }
            log.info("Filter button clicked", { filterType, userId: interaction.user.id, guildId: interaction.guildId });
        }
        catch (error) {
            log.error("Error handling filter button", { filterType, error: String(error) });
            await interaction.reply({ content: "An error occurred.", ephemeral: true }).catch(() => { });
        }
    });
    log.info("Music component handlers registered");
}
//# sourceMappingURL=musicComponentHandler.js.map