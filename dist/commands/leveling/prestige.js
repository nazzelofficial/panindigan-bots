import { UserModel } from "../../database/models/User.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";
import { config } from "../../config/config.js";
const command = {
    name: "prestige",
    description: "Reset your XP at max level to gain a prestige rank",
    category: "Leveling",
    access: "general",
    guildOnly: true,
    cooldown: 10,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const requiredLevel = config.leveling?.prestigeRequiredLevel ?? 100;
        const user = await UserModel.findOne({ userId: ctx.userId });
        if (!user) {
            await ctx.reply({ embeds: [errorEmbed("No leveling data found.")] });
            return;
        }
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            await ctx.reply({ embeds: [errorEmbed("You have no XP in this server yet.")] });
            return;
        }
        if (profile.level < requiredLevel) {
            await ctx.reply({ embeds: [errorEmbed(`You need to reach **Level ${requiredLevel}** before prestiging. You are currently Level **${profile.level}**.`)] });
            return;
        }
        const currentPrestige = profile.prestige ?? 0;
        profile.prestige = currentPrestige + 1;
        profile.xp = 0;
        profile.level = 0;
        await user.save();
        const embed = baseEmbed("warning")
            .setTitle("✨ Prestige Unlocked!")
            .setDescription(`Congratulations <@${ctx.userId}>!\nYou've reached **Prestige ${currentPrestige + 1}**!\n\nYour XP and level have been reset. Keep grinding!`)
            .setFooter({ text: `Prestige ${currentPrestige} → Prestige ${currentPrestige + 1}` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=prestige.js.map