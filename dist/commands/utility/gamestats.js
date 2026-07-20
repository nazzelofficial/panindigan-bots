import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "gamestats",
    description: "View your game statistics",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        const embed = baseEmbed("primary")
            .setTitle("🎮 Game Statistics")
            .addFields({ name: "Games Played", value: "0", inline: true }, { name: "Wins", value: "0", inline: true }, { name: "Losses", value: "0", inline: true })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=gamestats.js.map