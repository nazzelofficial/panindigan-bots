import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "charcount",
    description: "Count characters in text",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addStringOption((o) => o.setName("text").setDescription("Text to count").setRequired(true)),
    async execute(ctx) {
        const text = ctx.isSlash ? ctx.interaction.options.getString("text", true) : ctx.args.join(" ");
        const count = text.length;
        const embed = baseEmbed("primary")
            .setTitle("📝 Character Count")
            .setDescription(`**${count}** characters`);
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=charcount.js.map