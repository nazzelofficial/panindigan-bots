import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "welcometoggle",
    description: "Enable or disable welcome messages",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable welcome messages").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[0]?.toLowerCase() !== "off";
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        if (enabled && !cfg?.welcome?.channelId) {
            await ctx.reply({ embeds: [errorEmbed("Set a welcome channel first using `welcomechannel` or `welcomesetup`.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.enabled": enabled } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Welcome messages **${enabled ? "enabled" : "disabled"}**.`)] });
    },
};
export default command;
//# sourceMappingURL=welcomeToggle.js.map