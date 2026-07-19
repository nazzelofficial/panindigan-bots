import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "invest",
    description: "Invest coins",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("amount").setDescription("Amount to invest").setRequired(true).setMinValue(100))
        .addStringOption((o) => o.setName("type").setDescription("Investment type").setRequired(true).addChoices({ name: "Low Risk (5% return)", value: "low" }, { name: "Medium Risk (15% return)", value: "medium" }, { name: "High Risk (40% return)", value: "high" })),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const amount = ctx.isSlash ? ctx.interaction.options.getInteger("amount", true) : parseInt(ctx.args[0]);
        const type = ctx.isSlash ? ctx.interaction.options.getString("type", true) : ctx.args[1]?.toLowerCase();
        if (!amount || !type)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        if (profile.balance < amount) {
            return ctx.reply({ embeds: [errorEmbed("❌ Insufficient balance")] });
        }
        const returns = { low: 0.05, medium: 0.15, high: 0.40 };
        const returnRate = returns[type] || 0.05;
        const returnAmount = Math.floor(amount * returnRate);
        profile.balance = (profile.balance ?? 0) - amount;
        profile.investmentAmount = amount;
        profile.investmentReturn = returnAmount;
        profile.investmentType = type;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Invested ${amount} coins in ${type} risk. Potential return: ${returnAmount} coins`)] });
    },
};
export default command;
//# sourceMappingURL=invest.js.map