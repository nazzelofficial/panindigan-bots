import { infoEmbed } from "@/utils/embeds";
const command = {
    name: "lower",
    description: "Convert text to lowercase",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("text").setDescription("Text to convert").setRequired(true)),
    async execute(ctx) {
        const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.join(" ");
        await ctx.reply({ embeds: [infoEmbed(text.toLowerCase())], ephemeral: true });
    },
};
export default command;
//# sourceMappingURL=lower.js.map