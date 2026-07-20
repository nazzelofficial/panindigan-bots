import { successEmbed } from "../../utils/embeds.js";
const command = {
    name: "gamedaily",
    description: "Claim your daily game reward",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [successEmbed("🎁 Daily game reward claimed! +100 coins")] });
    },
};
export default command;
//# sourceMappingURL=gamedaily.js.map