import { baseEmbed } from "../../utils/embeds";
const command = {
    name: "premiuminfo",
    description: "View premium information",
    category: "Settings",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        const embed = baseEmbed("premium")
            .setTitle("💎 Premium Information")
            .setDescription("Premium features and benefits")
            .addFields({ name: "Features", value: "• Unlimited commands\n• Priority support\n• Custom branding", inline: true }, { name: "Price", value: "$9.99/month", inline: true }, { name: "Status", value: "Not active", inline: true })
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=premiuminfo.js.map