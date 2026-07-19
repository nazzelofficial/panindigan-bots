import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "business_collect",
    description: "Collect business revenue",
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
        const revenue = (profile.businessLevel || 1) * 1000;
        const pending = profile.businessRevenue || 0;
        if (pending === 0) {
            return ctx.reply({ embeds: [errorEmbed("❌ No revenue to collect")] });
        }
        profile.balance = (profile.balance ?? 0) + pending;
        profile.businessRevenue = 0;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Collected ${pending} coins from your business!`)] });
    },
};
export default command;
//# sourceMappingURL=businessCollect.js.map