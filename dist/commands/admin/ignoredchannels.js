import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "ignoredchannels",
    description: "List all channels where bot commands are ignored",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["ignoredch", "ignorelist"],
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const ignored = cfg?.ignoredChannels ?? [];
        if (!ignored.length) {
            await ctx.reply({ embeds: [infoEmbed("No channels are currently ignored.")] });
            return;
        }
        const embed = baseEmbed("primary")
            .setTitle("🔇 Ignored Channels")
            .setDescription(ignored.map((id) => `<#${id}>`).join("\n"))
            .setFooter({ text: `${ignored.length} channel${ignored.length !== 1 ? "s" : ""} ignored` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=ignoredchannels.js.map