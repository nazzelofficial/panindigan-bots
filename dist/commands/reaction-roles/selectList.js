import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, infoEmbed } from "@/utils/embeds";
const command = {
    name: "selectlist",
    description: "List all select-menu role panels configured for this server",
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
        const selects = (cfg?.reactionRoles ?? []).filter((r) => r.type === "select");
        if (!selects.length) {
            await ctx.reply({ embeds: [infoEmbed("No select role panels configured.")] });
            return;
        }
        const embed = baseEmbed("primary")
            .setTitle("📋 Select Role Panels")
            .setDescription(selects.map((r) => `msg: \`${r.messageId}\` in <#${r.channelId}>\nRoles: ${(r.roleIds ?? []).map((id) => `<@&${id}>`).join(", ")}`).join("\n\n").slice(0, 2048));
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=selectList.js.map