import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, baseEmbed } from "@/utils/embeds";
const command = {
    name: "muterolecreate",
    description: "Automatically create a Muted role with correct deny-send permissions on all channels",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageChannels],
    guildOnly: true,
    cooldown: 30,
    aliases: ["createmute", "makemuted"],
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        await ctx.reply({ embeds: [baseEmbed("info").setDescription("⏳ Creating Muted role and applying permissions…")] });
        const existing = guild.roles.cache.find((r) => r.name.toLowerCase() === "muted");
        let muteRole = existing;
        if (!muteRole) {
            muteRole = await guild.roles.create({
                name: "Muted",
                color: 0x808080,
                permissions: [],
                reason: `Mute role created by ${ctx.userId}`,
            });
        }
        let applied = 0;
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
                applied++;
            }
            catch {
                // Skip channels we can't modify
            }
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { muteRoleId: muteRole.id } }, { upsert: true });
        await ctx.reply({
            embeds: [
                successEmbed(`✅ Muted role ${existing ? "already existed — reused" : "**created**"} and permissions applied to **${applied}** channels.\nRole: <@&${muteRole.id}>`),
            ],
        });
    },
};
export default command;
//# sourceMappingURL=muteroleCreate.js.map