import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "8d",
    description: "Toggle 8D audio filter (rotational surround sound effect)",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["filter8d"],
    slashData: (b) => b,
    async execute(ctx) {
        if (!ctx.client.lavalink) {
            await ctx.reply({ embeds: [errorEmbed("Music isn't configured.")] });
            return;
        }
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const player = ctx.client.lavalink.getPlayer?.(guild.id);
        if (!player?.playing && !player?.paused) {
            await ctx.reply({ embeds: [errorEmbed("Nothing is currently playing.")] });
            return;
        }
        const enabled = player.get?.("filter_8d") ?? false;
        if (!enabled) {
            await player.setFilters?.({ rotation: { rotationHz: 0.2 } });
            player.set?.("filter_8d", true);
            await ctx.reply({ embeds: [successEmbed("🎧 8D audio filter **enabled**.")] });
        }
        else {
            await player.setFilters?.({});
            player.set?.("filter_8d", false);
            await ctx.reply({ embeds: [successEmbed("🎧 8D audio filter **disabled**.")] });
        }
    },
};
export default command;
//# sourceMappingURL=filter8D.js.map