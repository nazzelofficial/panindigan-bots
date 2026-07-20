import { infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "akinator",
    description: "Play Akinator - guess the character",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("🧞 Akinator game started! Think of a character and I will try to guess it.")] });
    },
};
export default command;
//# sourceMappingURL=akinator.js.map