import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "bugreport",
    description: "Report a bug",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("description").setDescription("Bug description").setRequired(true)),
    async execute(ctx) {
        const description = ctx.isSlash ? ctx.interaction.options.getString("description", true) : ctx.args.join(" ");
        if (!description) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a bug description.")] });
            return;
        }
        await ctx.reply({ embeds: [successEmbed("✅ Bug report submitted! Thank you for helping improve the bot.")] });
    },
};
export default command;
//# sourceMappingURL=bugreport.js.map