import { infoEmbed } from "@/utils/embeds";
const command = {
    name: "mocktext",
    description: "Convert text to mock case (sPoNgEbOb MeMe)",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("text").setDescription("Text to mock").setRequired(true)),
    async execute(ctx) {
        const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.join(" ");
        const mocked = text.split("").map((char, i) => (i % 2 === 0 ? char.toLowerCase() : char.toUpperCase())).join("");
        await ctx.reply({ embeds: [infoEmbed(`🤪 Mocked: ${mocked}`)] });
    },
};
export default command;
//# sourceMappingURL=mocktext.js.map