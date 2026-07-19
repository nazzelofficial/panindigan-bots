import { infoEmbed } from "../../utils/embeds";
const command = {
    name: "checkers",
    description: "Play Checkers",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addUserOption((o) => o.setName("opponent").setDescription("Opponent").setRequired(false)),
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("🔴⚫ Checkers game started!")] });
    },
};
export default command;
//# sourceMappingURL=checkers.js.map