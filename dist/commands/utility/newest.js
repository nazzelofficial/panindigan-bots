import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "newest",
    description: "Show the newest member in the server",
    category: "Utility",
    access: "general",
    guildOnly: true,
    slashData: (b) => b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        if (ctx.isSlash)
            await ctx.interaction.deferReply();
        await guild.members.fetch();
        const members = guild.members.cache.sort((a, b) => (b.joinedAt?.getTime() ?? 0) - (a.joinedAt?.getTime() ?? 0));
        const newest = members.first();
        const embed = baseEmbed("primary")
            .setTitle("👶 Newest Member")
            .setDescription(newest ? `<@${newest.user.id}> joined ${newest.joinedAt ? `<t:${Math.floor(newest.joinedAt.getTime() / 1000)}:R>` : "Unknown"}` : "No members")
            .setTimestamp();
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=newest.js.map