import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "filterclear",
    description: "Remove all active audio filters",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["clearfilter", "nofilter"],
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
        await player.setFilters?.({});
        // Clear any stored filter flags
        for (const flag of ["filter_8d", "filter_bassboost", "filter_nightcore", "filter_vaporwave"]) {
            player.set?.(flag, false);
        }
        await ctx.reply({ embeds: [successEmbed("🎛️ All audio filters cleared.")] });
    },
};
export default command;
//# sourceMappingURL=filterClear.js.map