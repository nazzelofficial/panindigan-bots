import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "rewardsremove",
    description: "Remove the role reward for a specific level",
    category: "Leveling",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    aliases: ["removereward", "levelrewardremove"],
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("level").setDescription("Level to remove the reward from").setRequired(true).setMinValue(1).setMaxValue(500)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const level = ctx.isSlash ? ctx.interaction.options.getInteger("level", true) : parseInt(ctx.args[0] ?? "0");
        if (!level) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a level.")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $pull: { "leveling.rewards": { level } } });
        await ctx.reply({ embeds: [successEmbed(`Level **${level}** reward removed.`)] });
    },
};
export default command;
//# sourceMappingURL=rewardsRemove.js.map