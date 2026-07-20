import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed } from "../../utils/embeds.js";
const command = {
    name: "autoroletoggle",
    description: "Enable or disable auto-role assignment (roles are preserved when disabled)",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable auto-roles").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const enabled = ctx.isSlash
            ? ctx.interaction.options.getBoolean("enabled", true)
            : ctx.args[0]?.toLowerCase() !== "off";
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { autoRoleEnabled: enabled } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Auto-role assignment **${enabled ? "enabled" : "disabled"}**.`)] });
    },
};
export default command;
//# sourceMappingURL=autoroleToggle.js.map