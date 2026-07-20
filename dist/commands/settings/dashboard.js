import { infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "dashboard",
    description: "Get a link to the web dashboard",
    category: "Settings",
    access: "admin",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("🌐 Dashboard: https://dashboard.example.com")] });
    },
};
export default command;
//# sourceMappingURL=dashboard.js.map