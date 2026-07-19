import { baseEmbed } from "@/utils/embeds";
const command = {
    name: "fishing",
    description: "Go fishing",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        const fish = Math.random() < 0.3 ? "🐟" : Math.random() < 0.5 ? "🐠" : "🦐";
        const embed = baseEmbed("primary").setTitle("🎣 Fishing").setDescription(`You caught a ${fish}!`);
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=fishing.js.map