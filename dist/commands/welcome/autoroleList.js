import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "autorolelist",
    description: "List all roles that are automatically assigned to new members",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    aliases: ["listautoroles", "autoroles"],
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const ids = cfg?.autoRoleIds ?? [];
        if (!ids.length) {
            await ctx.reply({ embeds: [infoEmbed("No auto-roles are configured. Use `autoroleadd` to add one.")] });
            return;
        }
        const embed = baseEmbed("primary")
            .setTitle("🎭 Auto-Roles")
            .setDescription(ids.map((id) => `• <@&${id}>`).join("\n"))
            .setFooter({ text: `${ids.length} auto-role${ids.length !== 1 ? "s" : ""} configured` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=autoroleList.js.map