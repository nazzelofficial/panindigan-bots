import { UserModel } from "../../database/models/User";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "pet_feed",
    description: "Feed your pet",
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
        if (!profile.pet) {
            return ctx.reply({ embeds: [errorEmbed("❌ You do not have a pet")] });
        }
        const cost = 100;
        if (profile.balance < cost) {
            return ctx.reply({ embeds: [errorEmbed(`❌ You need ${cost} coins to feed your pet`)] });
        }
        profile.balance = (profile.balance ?? 0) - cost;
        profile.petHunger = Math.max(0, (profile.petHunger ?? 0) - 20);
        profile.petHappiness = Math.min(100, (profile.petHappiness ?? 0) + 10);
        await user.save();
        await ctx.reply({ embeds: [successEmbed("✅ You fed your pet!")] });
    },
};
export default command;
//# sourceMappingURL=petFeed.js.map