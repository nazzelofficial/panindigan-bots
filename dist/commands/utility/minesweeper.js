import { infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "minesweeper",
    description: "Play Minesweeper",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("💣 Minesweeper game started!")] });
    },
};
export default command;
//# sourceMappingURL=minesweeper.js.map