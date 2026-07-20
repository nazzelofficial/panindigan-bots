import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "interest",
    description: "Collect bank interest",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 3600,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        if (profile.bank < 1000) {
            return ctx.reply({ embeds: [errorEmbed("❌ You need at least 1000 coins in your bank to collect interest")] });
        }
        const interestRate = 0.01; // 1%
        const interest = Math.floor(profile.bank * interestRate);
        profile.bank = (profile.bank ?? 0) + interest;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Collected ${interest} coins in interest!`)] });
    },
};
export default command;
//# sourceMappingURL=interest.js.map