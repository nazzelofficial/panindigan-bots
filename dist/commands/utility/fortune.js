import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "fortune",
    description: "Get a fortune cookie message",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        const fortunes = [
            "A beautiful, smart, and loving person will be coming into your life.",
            "A dubious friend may be an enemy in camouflage.",
            "A faithful friend is a strong defense.",
            "A fresh start will put you on your way.",
            "A golden egg of opportunity falls into your lap this month.",
        ];
        const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        const embed = baseEmbed("primary").setTitle("🥠 Fortune").setDescription(fortune);
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=fortune.js.map