import { infoEmbed } from "@/utils/embeds";
const command = {
    name: "mines",
    description: "Play Mines game",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("💣 Mines game started! Avoid the mines!")] });
    },
};
export default command;
//# sourceMappingURL=mines.js.map