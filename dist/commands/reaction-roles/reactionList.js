import { GuildModel } from "../../database/models/Guild";
import { baseEmbed, infoEmbed } from "../../utils/embeds";
const command = {
    name: "reactionlist",
    description: "List all reaction roles configured for this server",
    category: "Reaction Roles",
    access: "admin",
    guildOnly: true,
    cooldown: 5,
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const all = cfg?.reactionRoles ?? [];
        const reaction = all.filter((r) => r.type === "reaction");
        if (!reaction.length) {
            await ctx.reply({ embeds: [infoEmbed("No reaction roles configured. Use `reactionadd` to add one.")] });
            return;
        }
        const embed = baseEmbed("primary")
            .setTitle("🎭 Reaction Roles")
            .setDescription(reaction.map((r) => `${r.emoji} → <@&${r.roleId}> (msg: \`${r.messageId}\` in <#${r.channelId}>)`).join("\n").slice(0, 2048))
            .setFooter({ text: `${reaction.length} reaction role${reaction.length !== 1 ? "s" : ""}` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=reactionList.js.map