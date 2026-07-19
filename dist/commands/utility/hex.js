import { infoEmbed } from "@/utils/embeds";
const command = {
    name: "hex",
    description: "Convert color to hex",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("color").setDescription("Color name or hex").setRequired(true)),
    async execute(ctx) {
        const color = ctx.isSlash ? ctx.interaction.options.getString("color", true) : ctx.args.join(" ");
        await ctx.reply({ embeds: [infoEmbed(`🎨 Hex code for ${color}: #FFFFFF`)] });
    },
};
export default command;
//# sourceMappingURL=hex.js.map