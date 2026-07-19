import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "pet_play",
    description: "Play with your pet",
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
        profile.petHappiness = Math.min(100, (profile.petHappiness ?? 0) + 15);
        profile.petHunger = Math.min(100, (profile.petHunger ?? 0) + 5);
        await user.save();
        await ctx.reply({ embeds: [successEmbed("✅ You played with your pet!")] });
    },
};
export default command;
//# sourceMappingURL=petPlay.js.map