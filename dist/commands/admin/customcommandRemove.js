import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "customcommandremove",
    description: "Remove a custom command by name",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    guildOnly: true,
    cooldown: 5,
    aliases: ["removecustomcmd", "ccremove"],
    slashData: (b) => b
        .addStringOption((o) => o.setName("name").setDescription("Name of the custom command to remove").setRequired(true).setMaxLength(32)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const name = (ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[0])?.toLowerCase();
        if (!name) {
            await ctx.reply({ embeds: [errorEmbed("Please specify the command name.")] });
            return;
        }
        const result = await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { customCommands: { name } } }, { new: true });
        if (!result) {
            await ctx.reply({ embeds: [errorEmbed(`No custom command named \`${name}\` found.`)] });
            return;
        }
        await ctx.reply({ embeds: [successEmbed(`Custom command \`${name}\` removed.`)] });
    },
};
export default command;
//# sourceMappingURL=customcommandRemove.js.map