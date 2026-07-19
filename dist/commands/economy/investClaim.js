import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "invest_claim",
    description: "Claim investment returns",
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
        if (!profile.investmentAmount) {
            return ctx.reply({ embeds: [errorEmbed("❌ You have no active investments")] });
        }
        const returnAmount = profile.investmentReturn || 0;
        profile.balance = (profile.balance ?? 0) + returnAmount;
        profile.investmentAmount = 0;
        profile.investmentReturn = 0;
        profile.investmentType = null;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Claimed ${returnAmount} coins from your investment!`)] });
    },
};
export default command;
//# sourceMappingURL=investClaim.js.map