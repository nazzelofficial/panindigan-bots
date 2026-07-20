import { UserModel } from "../../database/models/User.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "leaderboardmessages",
    description: "Show the top message senders in this server",
    category: "Utility",
    access: "general",
    guildOnly: true,
    cooldown: 15,
    aliases: ["msgleaderboard", "topmessages"],
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("page").setDescription("Page number (default: 1)").setRequired(false).setMinValue(1)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const page = (ctx.isSlash ? (ctx.interaction.options.getInteger("page") ?? 1) : parseInt(ctx.args[0] ?? "1")) || 1;
        const pageSize = 10;
        const skip = (page - 1) * pageSize;
        const results = await UserModel.find({ "guilds.guildId": guild.id })
            .sort({ "guilds.messageCount": -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();
        if (!results.length) {
            await ctx.reply({ embeds: [infoEmbed("No message data found for this server.")] });
            return;
        }
        const lines = results.map((u, i) => {
            const guildData = u.guilds?.find((g) => g.guildId === guild.id);
            return `**${skip + i + 1}.** <@${u.userId}> — ${(guildData?.messageCount ?? 0).toLocaleString()} messages`;
        });
        const embed = baseEmbed("primary")
            .setTitle(`💬 Message Leaderboard — ${guild.name}`)
            .setDescription(lines.join("\n"))
            .setFooter({ text: `Page ${page}` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=leaderboardmessages.js.map