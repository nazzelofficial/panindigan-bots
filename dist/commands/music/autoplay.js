import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "autoplay",
    description: "Toggle autoplay mode (auto-adds related songs when queue ends)",
    category: "Music",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["ap"],
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
        if (!player) {
            await ctx.reply({ embeds: [errorEmbed("No active music player.")] });
            return;
        }
        const current = player.get?.("autoplay") ?? false;
        const next = !current;
        player.set?.("autoplay", next);
        await ctx.reply({ embeds: [successEmbed(`🎵 Autoplay **${next ? "enabled" : "disabled"}**.`)] });
    },
};
export default command;
//# sourceMappingURL=autoplay.js.map