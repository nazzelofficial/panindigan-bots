import { infoEmbed } from "../../utils/embeds";
const command = {
    name: "ascii",
    description: "Convert text to ASCII art",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("text").setDescription("Text to convert").setRequired(true)),
    async execute(ctx) {
        const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.join(" ");
        await ctx.reply({ embeds: [infoEmbed(`🔤 ASCII art for "${text}":\n\`\`\`\n${text}\n\`\`\``)] });
    },
};
export default command;
//# sourceMappingURL=ascii.js.map