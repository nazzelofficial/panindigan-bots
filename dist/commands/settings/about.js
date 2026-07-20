import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "about",
    description: "Learn about the bot",
    category: "Settings",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        const embed = baseEmbed("primary")
            .setTitle("ℹ️ About")
            .setDescription("A comprehensive Discord bot with 985+ commands")
            .addFields({ name: "Version", value: "0.1.2", inline: true }, { name: "Developer", value: "Panindigan", inline: true }, { name: "Library", value: "discord.js v14", inline: true })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=about.js.map