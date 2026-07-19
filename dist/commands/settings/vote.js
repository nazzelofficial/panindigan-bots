import { infoEmbed } from "../../utils/embeds";
const command = {
    name: "vote",
    description: "Get a link to vote for the bot",
    category: "Settings",
    access: "general",
    guildOnly: false,
    slashData: (b) => b,
    async execute(ctx) {
        await ctx.reply({ embeds: [infoEmbed("🗳️ Vote for the bot: https://top.gg/vote")] });
    },
};
export default command;
//# sourceMappingURL=vote.js.map