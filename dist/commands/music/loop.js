import { successEmbed, errorEmbed } from "@/utils/embeds";
const LOOP_MODES = ["off", "track", "queue"];
const command = {
    name: "loop",
    description: "Toggle loop mode: off / track / queue",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
    aliases: ["repeat"],
    slashData: (b) => b.addStringOption((o) => o.setName("mode").setDescription("Loop mode").setRequired(false)
        .addChoices({ name: "Off", value: "off" }, { name: "Track (repeat current song)", value: "track" }, { name: "Queue (repeat whole queue)", value: "queue" })),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const lava = ctx.client.lavalink;
        if (!lava) {
            await ctx.reply({ embeds: [errorEmbed("Hindi available ang music system sa ngayon.")] });
            return;
        }
        const player = lava.getPlayer?.(guild.id);
        if (!player) {
            await ctx.reply({ embeds: [errorEmbed("No active music player.")] });
            return;
        }
        const modeArg = (ctx.isSlash ? ctx.interaction.options.getString("mode") : ctx.args[0]?.toLowerCase());
        let current = player.repeatMode ?? "off";
        let next;
        if (modeArg && LOOP_MODES.includes(modeArg)) {
            next = modeArg;
        }
        else {
            // Cycle: off → track → queue → off
            const idx = LOOP_MODES.indexOf(current);
            next = LOOP_MODES[(idx + 1) % LOOP_MODES.length];
        }
        if (typeof player.setRepeatMode === "function") {
            await player.setRepeatMode(next === "off" ? 0 : next === "track" ? 1 : 2);
        }
        else if (player.repeatMode !== undefined) {
            player.repeatMode = next;
        }
        const labels = {
            off: "🔁 Loop **OFF**",
            track: "🔂 Loop **TRACK** — paulit-ulit ang current track",
            queue: "🔁 Loop **QUEUE** — paulit-ulit ang full queue",
        };
        await ctx.reply({ embeds: [successEmbed(labels[next])] });
    },
};
export default command;
//# sourceMappingURL=loop.js.map