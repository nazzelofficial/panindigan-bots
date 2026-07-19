import { infoEmbed } from "@/utils/embeds";
const command = {
    name: "2048game",
    description: "Play 2048",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("🎮 2048 game started! Combine tiles to reach 2048.")] });
    },
};
export default command;
//# sourceMappingURL=2048game.js.map