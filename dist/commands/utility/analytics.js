import { baseEmbed } from "../../utils/embeds";
const command = {
    name: "analytics",
    description: "View bot analytics",
    category: "Utility",
    access: "admin",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        const embed = baseEmbed("primary")
            .setTitle("📈 Bot Analytics")
            .addFields({ name: "Servers", value: String(ctx.client.guilds.cache.size), inline: true }, { name: "Users", value: String(ctx.client.users.cache.size), inline: true }, { name: "Commands Used", value: "0", inline: true })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=analytics.js.map