import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "notificationlist",
    description: "List all notification roles members can self-assign",
    category: "Reaction Roles",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const notifs = cfg?.notificationRoles ?? [];
        if (!notifs.length) {
            await ctx.reply({ embeds: [infoEmbed("No notification roles configured.")] });
            return;
        }
        const embed = baseEmbed("primary").setTitle("🔔 Notification Roles").setDescription(notifs.map((n) => `• <@&${n.roleId}>${n.description ? ` — ${n.description}` : ""}`).join("\n")).setFooter({ text: `${notifs.length} notification role${notifs.length !== 1 ? "s" : ""}` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=notificationList.js.map