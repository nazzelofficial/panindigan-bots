import { baseEmbed } from "../../utils/embeds";
const command = {
    name: "8ball",
    description: "Ask the magic 8-ball a question",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("question").setDescription("Your question").setRequired(true)),
    async execute(ctx) {
        const responses = ["Yes", "No", "Maybe", "Ask again later", "Cannot predict now", "Don't count on it"];
        const response = responses[Math.floor(Math.random() * responses.length)];
        await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🎱 Magic 8-Ball").setDescription(response)] });
    },
};
export default command;
//# sourceMappingURL=8ball.js.map