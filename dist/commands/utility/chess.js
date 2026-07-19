import { infoEmbed } from "@/utils/embeds";
const command = {
    name: "chess",
    description: "Play Chess",
    category: "Utility",
    access: "general",
    guildOnly: false,
    slashData: (b) => b.addUserOption((o) => o.setName("opponent").setDescription("Opponent").setRequired(false)),
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("♟️ Chess game started!")] });
    },
};
export default command;
//# sourceMappingURL=chess.js.map