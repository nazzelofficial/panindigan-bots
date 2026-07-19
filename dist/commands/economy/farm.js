import { UserModel } from "../../database/models/User";
import { successEmbed } from "../../utils/embeds";
const command = {
    name: "farm",
    description: "Go farming for coins",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 30,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const crops = [
            { name: "🌾 Wheat", value: 50 },
            { name: "🌽 Corn", value: 75 },
            { name: "🥕 Carrot", value: 100 },
            { name: "🍅 Tomato", value: 120 },
            { name: "🥔 Potato", value: 80 },
            { name: "🍓 Strawberry", value: 200 },
            { name: "🍇 Grapes", value: 250 },
            { name: "🍎 Apple", value: 150 }
        ];
        const harvested = crops[Math.floor(Math.random() * crops.length)];
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        profile.balance = (profile.balance ?? 0) + harvested.value;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`🌾 You harvested ${harvested.name} and earned ${harvested.value} coins!`)] });
    },
};
export default command;
//# sourceMappingURL=farm.js.map