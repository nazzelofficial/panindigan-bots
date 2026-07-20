import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "business_upgrade",
    description: "Upgrade your business",
    category: "Economy",
    access: "general",
    guildOnly: true,
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
        if (!profile.business) {
            return ctx.reply({ embeds: [errorEmbed("❌ You do not have a business")] });
        }
        const currentLevel = profile.businessLevel || 1;
        const cost = currentLevel * 10000;
        if (profile.balance < cost) {
            return ctx.reply({ embeds: [errorEmbed(`❌ You need ${cost} coins to upgrade to level ${currentLevel + 1}`)] });
        }
        profile.balance = (profile.balance ?? 0) - cost;
        profile.businessLevel = currentLevel + 1;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Business upgraded to level ${currentLevel + 1}!`)] });
    },
};
export default command;
//# sourceMappingURL=businessUpgrade.js.map