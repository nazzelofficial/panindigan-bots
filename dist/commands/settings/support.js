import { infoEmbed } from "../../utils/embeds";
const command = {
    name: "support",
    description: "Get a link to the support server",
    category: "Settings",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("🆘 Support server: https://discord.gg/support")] });
    },
};
export default command;
//# sourceMappingURL=support.js.map