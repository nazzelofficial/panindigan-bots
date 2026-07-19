import { UserModel } from "../../database/models/User";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "bid",
    description: "Place a bid in an auction",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addIntegerOption((o) => o.setName("amount").setDescription("Bid amount").setRequired(true).setMinValue(1)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const amount = ctx.isSlash ? ctx.interaction.options.getInteger("amount", true) : parseInt(ctx.args[0]);
        if (!amount)
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
        await ctx.reply({ embeds: [successEmbed(`📢 Bid of ${amount} coins placed!`)] });
    },
};
export default command;
//# sourceMappingURL=bid.js.map