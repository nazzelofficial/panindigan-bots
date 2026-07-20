import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "lottery_buy",
    description: "Buy a lottery ticket",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addIntegerOption((o) => o.setName("amount").setDescription("Number of tickets").setRequired(true).setMinValue(1).setMaxValue(10)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const amount = ctx.isSlash ? ctx.interaction.options.getInteger("amount", true) : parseInt(ctx.args[0]);
        if (!amount)
            return;
        const cost = amount * 100;
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        if (profile.balance < cost) {
            return ctx.reply({ embeds: [errorEmbed(`❌ You need ${cost} coins to buy ${amount} tickets`)] });
        }
        profile.balance = (profile.balance ?? 0) - cost;
        profile.lotteryTickets = (profile.lotteryTickets ?? 0) + amount;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ You bought ${amount} lottery tickets!`)] });
    },
};
export default command;
//# sourceMappingURL=lotteryBuy.js.map