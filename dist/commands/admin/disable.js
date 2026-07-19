import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed, baseEmbed, infoEmbed } from "@/utils/embeds";
const command = {
    name: "disable",
    description: "Disable or enable commands in this server, or view the disabled list",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    aliases: ["enable"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("command")
        .setDescription("Disable a command in this server")
        .addStringOption((o) => o.setName("name").setDescription("Command name").setRequired(true)))
        .addSubcommand((s) => s
        .setName("enable")
        .setDescription("Re-enable a command in this server")
        .addStringOption((o) => o.setName("name").setDescription("Command name").setRequired(true)))
        .addSubcommand((s) => s.setName("list").setDescription("List all disabled commands")),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        if (sub === "command") {
            const cmdName = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1]?.toLowerCase();
            if (!cmdName) {
                await ctx.reply({ embeds: [errorEmbed("Provide a command name.")] });
                return;
            }
            if (!ctx.client.commands.has(cmdName)) {
                await ctx.reply({ embeds: [errorEmbed(`Command \`${cmdName}\` doesn't exist.`)] });
                return;
            }
            if (["disable", "enable"].includes(cmdName)) {
                await ctx.reply({ embeds: [errorEmbed("You cannot disable the disable/enable command itself.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $addToSet: { disabledCommands: cmdName } }, { upsert: true });
            await ctx.reply({ embeds: [successEmbed(`Command \`${cmdName}\` has been disabled in this server.`)] });
        }
        else if (sub === "enable") {
            const cmdName = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1]?.toLowerCase();
            if (!cmdName) {
                await ctx.reply({ embeds: [errorEmbed("Provide a command name.")] });
                return;
            }
            await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { disabledCommands: cmdName } });
            await ctx.reply({ embeds: [successEmbed(`Command \`${cmdName}\` has been enabled.`)] });
        }
        else if (sub === "list") {
            const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
            const disabled = cfg?.disabledCommands ?? [];
            if (!disabled.length) {
                await ctx.reply({ embeds: [infoEmbed("No commands are disabled.")] });
                return;
            }
            const embed = baseEmbed("warning")
                .setTitle("🚫 Disabled Commands")
                .setDescription(disabled.map((c) => `\`${c}\``).join(", "));
            await ctx.reply({ embeds: [embed] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: command | enable | list")] });
        }
    },
};
export default command;
//# sourceMappingURL=disable.js.map