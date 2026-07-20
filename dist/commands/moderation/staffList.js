import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed } from "../../utils/embeds.js";
const command = {
    name: "stafflist",
    description: "List all staff members (Admins, Moderators, DJs) configured in this server",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ModerateMembers],
    guildOnly: true,
    cooldown: 10,
    aliases: ["staff", "staffmembers"],
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const doc = cfg;
        const adminRoles = doc?.adminRoleIds ?? [];
        const modRoles = doc?.modRoleIds ?? [];
        const djRoles = doc?.djRoleIds ?? [];
        await guild.members.fetch();
        const getMembers = (roleIds) => {
            if (!roleIds.length)
                return "None configured";
            const members = [];
            for (const roleId of roleIds) {
                const role = guild.roles.cache.get(roleId);
                if (!role)
                    continue;
                role.members.forEach((m) => {
                    if (!members.includes(`<@${m.id}>`))
                        members.push(`<@${m.id}>`);
                });
            }
            return members.length ? members.slice(0, 30).join(", ") + (members.length > 30 ? ` +${members.length - 30} more` : "") : "No members with this role";
        };
        const embed = baseEmbed("primary")
            .setTitle("👥 Server Staff")
            .setThumbnail(guild.iconURL())
            .addFields({
            name: `🛡️ Admins (${adminRoles.length} role${adminRoles.length !== 1 ? "s" : ""})`,
            value: adminRoles.length ? adminRoles.map((id) => `<@&${id}>`).join(", ") : "None",
            inline: false,
        }, {
            name: `🔨 Moderators (${modRoles.length} role${modRoles.length !== 1 ? "s" : ""})`,
            value: modRoles.length ? modRoles.map((id) => `<@&${id}>`).join(", ") : "None",
            inline: false,
        }, {
            name: `🎵 DJs (${djRoles.length} role${djRoles.length !== 1 ? "s" : ""})`,
            value: djRoles.length ? djRoles.map((id) => `<@&${id}>`).join(", ") : "None",
            inline: false,
        }, {
            name: "🔇 Mute Role",
            value: doc?.muteRoleId ? `<@&${doc.muteRoleId}>` : "None",
            inline: true,
        }, {
            name: "✅ Verified Role",
            value: doc?.verifiedRoleId ? `<@&${doc.verifiedRoleId}>` : "None",
            inline: true,
        })
            .setFooter({ text: `${guild.name} • Use /modrole to manage staff roles` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=staffList.js.map