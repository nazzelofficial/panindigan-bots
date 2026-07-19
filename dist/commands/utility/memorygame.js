import { infoEmbed } from "@/utils/embeds";
const command = {
    name: "memorygame",
    description: "Play a memory game",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("🧠 Memory game started! Match the pairs.")] });
    },
};
export default command;
//# sourceMappingURL=memorygame.js.map