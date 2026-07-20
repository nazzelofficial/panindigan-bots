import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "verifytimeout",
    description: "Set how many minutes new members have to verify before being auto-kicked (0 = disabled)",
    category: "Verification",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("minutes").setDescription("Timeout in minutes (0 to disable, max 10080 = 7 days)").setRequired(true).setMinValue(0).setMaxValue(10080)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const minutes = ctx.isSlash ? ctx.interaction.options.getInteger("minutes", true) : parseInt(ctx.args[0] ?? "0");
        if (isNaN(minutes) || minutes < 0 || minutes > 10080) {
            await ctx.reply({ embeds: [errorEmbed("Timeout must be between 0 and 10080 minutes (7 days).")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "verification.timeoutMinutes": minutes } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(minutes === 0 ? "Verification timeout **disabled**. Members will not be auto-kicked." : `Verification timeout set to **${minutes} minute${minutes !== 1 ? "s" : ""}**. Use \`verifykick\` to kick timed-out members manually.`)] });
    },
};
export default command;
//# sourceMappingURL=verifyTimeout.js.map