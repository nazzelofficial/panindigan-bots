import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "hunting",
    description: "Go hunting",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        const animal = Math.random() < 0.3 ? "🦌" : Math.random() < 0.5 ? "🐇" : "🦊";
        const embed = baseEmbed("primary").setTitle("🏹 Hunting").setDescription(`You spotted a ${animal}!`);
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=hunting.js.map