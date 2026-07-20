import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "boosttoggle",
    description: "Enable or disable boost announcement messages",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable boost messages").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[0]?.toLowerCase() !== "off";
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        if (enabled && !cfg?.boostMessage?.channelId) {
            await ctx.reply({ embeds: [errorEmbed("Set a boost channel first using `boostchannel`.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "boostMessage.enabled": enabled } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Boost announcements **${enabled ? "enabled" : "disabled"}**.`)] });
    },
};
export default command;
//# sourceMappingURL=boostToggle.js.map