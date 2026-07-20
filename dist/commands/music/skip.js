import { successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "skip",
    description: "Skip the current or a specific number of tracks",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 3,
    aliases: ["s", "next"],
    slashData: (b) => b.addIntegerOption((o) => o.setName("count").setDescription("Number of tracks to skip").setRequired(false).setMinValue(1)),
    async execute(ctx) {
        if (!ctx.client.lavalink) {
            await ctx.reply({ embeds: [errorEmbed("Music is not configured.")] });
            return;
        }
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const player = ctx.client.lavalink.players?.get(guild.id);
        if (!player?.queue?.current) {
            await ctx.reply({ embeds: [infoEmbed("Nothing is currently playing.")] });
            return;
        }
        const count = ctx.isSlash ? (ctx.interaction.options.getInteger("count") ?? 1) : (parseInt(ctx.args[0] ?? "1") || 1);
        const current = player.queue.current;
        for (let i = 0; i < count; i++) {
            await player.skip?.();
        }
        await ctx.reply({ embeds: [successEmbed(`⏭️ Skipped **${count}** track${count !== 1 ? "s" : ""}. Was playing: **${current.title}**`)] });
    },
};
export default command;
//# sourceMappingURL=skip.js.map