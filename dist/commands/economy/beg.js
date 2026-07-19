import { UserModel } from "../../database/models/User";
import { successEmbed, errorEmbed } from "../../utils/embeds";
const command = {
    name: "beg",
    description: "Beg for coins",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 30,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const chance = Math.random();
        const amount = Math.floor(Math.random() * 100) + 1;
        if (chance > 0.5) {
            const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
            let profile = user.guilds.find((g) => g.guildId === guild.id);
            if (!profile) {
                user.guilds.push({ guildId: guild.id });
                await user.save();
                profile = user.guilds[user.guilds.length - 1];
            }
            profile.balance = (profile.balance ?? 0) + amount;
            await user.save();
            await ctx.reply({ embeds: [successEmbed(`🙏 Someone gave you ${amount} coins!`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("😢 No one gave you anything")] });
        }
    },
};
export default command;
//# sourceMappingURL=beg.js.map