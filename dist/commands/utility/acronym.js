import { infoEmbed } from "@/utils/embeds";
const command = {
    name: "acronym",
    description: "Get the meaning of an acronym",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("acronym").setDescription("Acronym to look up").setRequired(true)),
    async execute(ctx) {
        const acronym = ctx.isSlash ? ctx.interaction.options.getString("acronym", true) : ctx.args[0];
        await ctx.reply({ embeds: [infoEmbed(`📚 Meaning of ${acronym}: [Definition placeholder]`)] });
    },
};
export default command;
//# sourceMappingURL=acronym.js.map