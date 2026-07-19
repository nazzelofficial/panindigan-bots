import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "skipto",
    description: "Skip to a specific position in the queue",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["jumpto"],
    slashData: (b) => b.addIntegerOption((o) => o.setName("position").setDescription("Queue position to skip to (1 = next)").setRequired(true).setMinValue(1)),
    async execute(ctx) {
        if (!ctx.client.lavalink) {
            await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] });
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
        const pos = ctx.isSlash ? ctx.interaction.options.getInteger("position", true) : (parseInt(ctx.args[0] ?? "1") || 1);
        const tracks = player.queue?.tracks ?? [];
        if (pos < 1 || pos > tracks.length) {
            await ctx.reply({ embeds: [errorEmbed(`Invalid position. Queue has **${tracks.length}** upcoming track${tracks.length !== 1 ? "s" : ""}.`)] });
            return;
        }
        const target = tracks[pos - 1];
        tracks.splice(0, pos - 1);
        if (typeof player.skip === "function")
            await player.skip();
        const title = target?.info?.title ?? target?.title ?? `Track #${pos}`;
        await ctx.reply({ embeds: [successEmbed(`⏭️ Skipped to **${title}** (position #${pos}).`)] });
    },
};
export default command;
//# sourceMappingURL=skipTo.js.map