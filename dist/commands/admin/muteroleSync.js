import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";
const command = {
    name: "muterolesync",
    description: "Sync the configured mute role permissions across all channels",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageChannels],
    guildOnly: true,
    cooldown: 30,
    aliases: ["syncmuterole", "mutesync"],
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const muteRoleId = cfg?.muteRoleId ?? null;
        if (!muteRoleId) {
            await ctx.reply({
                embeds: [errorEmbed("No mute role is configured. Use `muterole setmute` or `muterolecreate` first.")],
            });
            return;
        }
        const muteRole = guild.roles.cache.get(muteRoleId);
        if (!muteRole) {
            await ctx.reply({ embeds: [errorEmbed("Configured mute role no longer exists. Please reconfigure it.")] });
            return;
        }
        await ctx.reply({ embeds: [baseEmbed("info").setDescription("⏳ Syncing mute role permissions across all channels…")] });
        let synced = 0;
        let failed = 0;
        for (const channel of guild.channels.cache.values()) {
            try {
                await channel.permissionOverwrites.edit(muteRole, {
                    SendMessages: false,
                    AddReactions: false,
                    Speak: false,
                    Stream: false,
                    SendMessagesInThreads: false,
                    CreatePublicThreads: false,
                    CreatePrivateThreads: false,
                });
                synced++;
            }
            catch {
                failed++;
            }
        }
        await ctx.reply({
            embeds: [
                successEmbed(`Mute role synced across **${synced}** channel${synced !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} skipped — insufficient permissions)` : ""}.`),
            ],
        });
    },
};
export default command;
//# sourceMappingURL=muteroleSync.js.map