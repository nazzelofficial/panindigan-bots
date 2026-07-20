import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "logstoggle",
    description: "Enable or disable the entire logging system for this server",
    category: "Logging",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["logtoggle", "togglelogs"],
    slashData: (b) => b
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable logging").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[0]?.toLowerCase() !== "off";
        if (enabled) {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const channels = cfg?.logging?.channels ?? {};
            if (!Object.keys(channels).length) {
                await ctx.reply({ embeds: [errorEmbed("Set a log channel first using `logssetup` or `logschannel`.")] });
                return;
            }
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "logging.enabled": enabled } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Logging **${enabled ? "enabled" : "disabled"}**.`)] });
    },
};
export default command;
//# sourceMappingURL=logsToggle.js.map