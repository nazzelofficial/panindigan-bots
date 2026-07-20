import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed } from "../../utils/embeds.js";
const command = {
    name: "welcome status",
    description: "Toggle welcome system on/off",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 5,
    slashData: (b) => b.addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable welcome").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[0]?.toLowerCase() !== "false";
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.enabled": enabled } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Welcome system ${enabled ? "enabled" : "disabled"}.`)] });
    },
};
export default command;
//# sourceMappingURL=welcomeStatus.js.map