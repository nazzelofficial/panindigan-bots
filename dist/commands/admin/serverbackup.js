import { PermissionFlagsBits } from "discord.js";
import { ServerBackupModel } from "@/database/models/Community";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, successEmbed, errorEmbed, infoEmbed } from "@/utils/embeds";
const command = {
    name: "serverbackup",
    description: "Create and manage server configuration backups",
    category: "Admin",
    access: "admin",
    premium: true,
    memberPermissions: [PermissionFlagsBits.Administrator],
    guildOnly: true,
    cooldown: 60,
    aliases: ["backup", "guildbackup"],
    slashData: (b) => b
        .addSubcommand((s) => s.setName("create").setDescription("Create a snapshot backup of this server's configuration"))
        .addSubcommand((s) => s.setName("list").setDescription("List all saved backups for this server"))
        .addSubcommand((s) => s.setName("delete")
        .setDescription("Delete a server backup")
        .addStringOption((o) => o.setName("id").setDescription("Backup ID").setRequired(true)))
        .addSubcommand((s) => s.setName("info")
        .setDescription("View details of a specific backup")
        .addStringOption((o) => o.setName("id").setDescription("Backup ID").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase() ?? "list";
        if (sub === "create") {
            const existing = await ServerBackupModel.countDocuments({ guildId: guild.id });
            if (existing >= 5) {
                await ctx.reply({ embeds: [errorEmbed("Maximum 5 backups per server. Delete an old backup first.")] });
                return;
            }
            if (guild.memberCount > guild.members.cache.size)
                await guild.members.fetch().catch(() => { });
            const guildDoc = await GuildModel.findOne({ guildId: guild.id }).lean();
            const data = {
                name: guild.name,
                iconURL: guild.iconURL(),
                memberCount: guild.memberCount,
                roles: guild.roles.cache
                    .filter((r) => !r.managed && r.id !== guild.id)
                    .map((r) => ({ id: r.id, name: r.name, color: r.hexColor, permissions: r.permissions.bitfield.toString(), hoist: r.hoist, mentionable: r.mentionable, position: r.position })),
                channels: guild.channels.cache
                    .filter((c) => !c.isThread())
                    .map((c) => ({ id: c.id, name: c.name, type: c.type, parentId: c.parentId ?? null, position: c.position ?? 0 })),
                botConfig: guildDoc ? JSON.parse(JSON.stringify(guildDoc)) : null,
                capturedAt: new Date(),
                capturedBy: ctx.userId,
            };
            const backup = await ServerBackupModel.create({ guildId: guild.id, createdBy: ctx.userId, data });
            await ctx.reply({
                embeds: [
                    successEmbed(`✅ Server backup created!\n\n**ID:** \`${backup._id}\`\n**Roles:** ${data.roles.length}\n**Channels:** ${data.channels.length}\n**Bot config:** ${data.botConfig ? "Included" : "None"}\n\nUse the ID to restore reference data with \`/serverbackup info [id]\`.`),
                ],
            });
        }
        else if (sub === "list") {
            const backups = await ServerBackupModel.find({ guildId: guild.id }).lean().limit(5).sort({ createdAt: -1 });
            if (!backups.length) {
                await ctx.reply({ embeds: [infoEmbed("No backups found. Use `/serverbackup create` to create one.")] });
                return;
            }
            const embed = baseEmbed("primary").setTitle("💾 Server Backups").setDescription(backups.map((b, i) => {
                const d = b.data;
                const ts = Math.floor(new Date(b.createdAt).getTime() / 1000);
                return `**${i + 1}.** \`${b._id}\` · <t:${ts}:R>\n↳ ${d.roles?.length ?? 0} roles, ${d.channels?.length ?? 0} channels · by <@${b.createdBy}>`;
            }).join("\n\n")).setFooter({ text: `${backups.length}/5 backup slots used` });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "info") {
            const id = ctx.isSlash ? ctx.interaction.options.getString("id", true) : ctx.args[1];
            const backup = await ServerBackupModel.findById(id).catch(() => null);
            if (!backup || backup.guildId !== guild.id) {
                await ctx.reply({ embeds: [errorEmbed("Backup not found.")] });
                return;
            }
            const d = backup.data;
            const embed = baseEmbed("primary").setTitle("💾 Backup Info").addFields({ name: "Server Name", value: d.name ?? guild.name, inline: true }, { name: "Member Count", value: String(d.memberCount ?? "?"), inline: true }, { name: "Captured By", value: `<@${backup.createdBy}>`, inline: true }, { name: "Roles", value: String(d.roles?.length ?? 0), inline: true }, { name: "Channels", value: String(d.channels?.length ?? 0), inline: true }, { name: "Bot Config", value: d.botConfig ? "Included" : "Not included", inline: true }, { name: "Created", value: `<t:${Math.floor(new Date(backup.createdAt).getTime() / 1000)}:F>`, inline: false });
            await ctx.reply({ embeds: [embed] });
        }
        else if (sub === "delete") {
            const id = ctx.isSlash ? ctx.interaction.options.getString("id", true) : ctx.args[1];
            const backup = await ServerBackupModel.findById(id).catch(() => null);
            if (!backup || backup.guildId !== guild.id) {
                await ctx.reply({ embeds: [errorEmbed("Backup not found.")] });
                return;
            }
            await ServerBackupModel.findByIdAndDelete(id);
            await ctx.reply({ embeds: [successEmbed(`Backup \`${id}\` deleted.`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: create | list | info | delete")] });
        }
    },
};
export default command;
//# sourceMappingURL=serverbackup.js.map