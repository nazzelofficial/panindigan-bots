import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "rewardsadd",
    description: "Add a role reward for reaching a specific level",
    category: "Leveling",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageRoles],
    guildOnly: true,
    cooldown: 5,
    aliases: ["addreward", "levelrewardadd"],
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("level").setDescription("Level required to receive the reward").setRequired(true).setMinValue(1).setMaxValue(500))
        .addRoleOption((o) => o.setName("role").setDescription("Role to award").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const level = ctx.isSlash ? ctx.interaction.options.getInteger("level", true) : parseInt(ctx.args[0] ?? "0");
        const roleId = ctx.isSlash ? ctx.interaction.options.getRole("role", true).id : ctx.args[1]?.replace(/\D/g, "");
        if (!level || !roleId) {
            await ctx.reply({ embeds: [errorEmbed("Please specify a level and a role.")] });
            return;
        }
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const existing = cfg?.leveling?.rewards ?? [];
        if (existing.some((r) => r.level === level)) {
            await ctx.reply({ embeds: [errorEmbed(`Level **${level}** already has a reward. Remove it first with \`rewardsremove\`.`)] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $push: { "leveling.rewards": { level, roleId } } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Members who reach **Level ${level}** will now receive <@&${roleId}>.`)] });
    },
};
export default command;
//# sourceMappingURL=rewardsAdd.js.map