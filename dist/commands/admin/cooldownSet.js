import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "cooldownset",
    description: "Override the cooldown of a specific command in this server",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["setcooldown", "cdset"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("command").setDescription("Command name").setRequired(true))
        .addIntegerOption((o) => o
        .setName("seconds")
        .setDescription("Cooldown in seconds (0 to remove override)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(3600)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cmdName = ctx.isSlash
            ? ctx.interaction.options.getString("command", true).toLowerCase()
            : ctx.args[0]?.toLowerCase();
        const seconds = ctx.isSlash
            ? ctx.interaction.options.getInteger("seconds", true)
            : parseInt(ctx.args[1] ?? "0", 10);
        if (!cmdName) {
            await ctx.reply({ embeds: [errorEmbed("Please provide a command name.")] });
            return;
        }
        if (!ctx.client.commands.has(cmdName)) {
            await ctx.reply({ embeds: [errorEmbed(`Command \`${cmdName}\` does not exist.`)] });
            return;
        }
        if (seconds === 0) {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { [`commandCooldowns.${cmdName}`]: "" } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Cooldown override for \`${cmdName}\` removed — now using the default cooldown.`)] });
        }
        else {
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { [`commandCooldowns.${cmdName}`]: seconds } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Cooldown for \`${cmdName}\` set to **${seconds}s** in this server.`)] });
        }
    },
};
export default command;
//# sourceMappingURL=cooldownSet.js.map