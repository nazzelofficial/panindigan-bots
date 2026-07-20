import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "rewardslist",
    description: "List all level-up role rewards for this server",
    category: "Leveling",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["levelrewards", "rewards"],
    slashData: (_b) => _b,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
        const rewards = (cfg?.leveling?.rewards ?? []).sort((a, b) => a.level - b.level);
        if (!rewards.length) {
            await ctx.reply({ embeds: [infoEmbed("No level rewards configured. Use `rewardsadd` to add one.")] });
            return;
        }
        const embed = baseEmbed("primary")
            .setTitle("🏆 Level Rewards")
            .setDescription(rewards.map((r) => `**Level ${r.level}** → <@&${r.roleId}>`).join("\n"))
            .setFooter({ text: `${rewards.length} reward${rewards.length !== 1 ? "s" : ""} configured` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=rewardsList.js.map