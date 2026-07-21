import { ModCaseModel } from "../../database/models/Moderation.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "kicklist",
    description: "List the most recently kicked members in this server",
    category: "Moderation",
    access: "moderator",
    guildOnly: true,
    cooldown: 5,
    aliases: ["recentkicks", "kicked"],
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("limit").setDescription("Number of entries to show (max 20)").setRequired(false).setMinValue(1).setMaxValue(20)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const limit = ctx.isSlash ? (ctx.interaction.options.getInteger("limit") ?? 10) : Math.min(parseInt(ctx.args[0]) || 10, 20);
        const kicks = await ModCaseModel.find({ guildId: guild.id, type: "kick" }).lean().sort({ createdAt: -1 }).limit(limit);
        if (!kicks.length) {
            await ctx.reply({ embeds: [infoEmbed("No kick records found.")] });
            return;
        }
        const embed = baseEmbed("warning")
            .setTitle("👢 Recent Kicks")
            .setDescription(kicks.map((k, i) => {
            const ts = Math.floor(new Date(k.createdAt).getTime() / 1000);
            return `**${i + 1}.** <@${k.userId}> — kicked by <@${k.moderatorId}> <t:${ts}:R>\n↳ ${k.reason}`;
        }).join("\n\n").slice(0, 4000))
            .setFooter({ text: `Showing last ${kicks.length} kicks · Case IDs: ${kicks.map((k) => k.caseId).join(", ")}` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=kicklist.js.map