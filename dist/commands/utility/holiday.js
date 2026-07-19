import { infoEmbed } from "@/utils/embeds";
const command = {
    name: "holiday",
    description: "Check if today is a holiday",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("🎉 Today is not a special holiday")] });
    },
};
export default command;
//# sourceMappingURL=holiday.js.map