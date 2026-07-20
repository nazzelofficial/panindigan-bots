import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "cooldownreset",
    description: "Reset all custom command cooldown overrides in this server",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["resetcooldown", "cdreset"],
    slashData: (b) => b
        .addStringOption((o) => o
        .setName("command")
        .setDescription("Command name (leave empty to reset all overrides)")
        .setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cmdName = ctx.isSlash
            ? ctx.interaction.options.getString("command")?.toLowerCase() ?? null
            : ctx.args[0]?.toLowerCase() ?? null;
        if (cmdName) {
            if (!ctx.client.commands.has(cmdName)) {
                await ctx.reply({ embeds: [errorEmbed(`Command \`${cmdName}\` does not exist.`)] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { [`commandCooldowns.${cmdName}`]: "" } });
            await ctx.reply({ embeds: [successEmbed(`Cooldown override for \`${cmdName}\` has been reset to default.`)] });
        }
        else {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { commandCooldowns: {} } });
            await ctx.reply({ embeds: [successEmbed("All command cooldown overrides have been reset.")] });
        }
    },
};
export default command;
//# sourceMappingURL=cooldownReset.js.map