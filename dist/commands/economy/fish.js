import { UserModel } from "../../database/models/User.js";
import { successEmbed } from "../../utils/embeds.js";
const command = {
    name: "fish",
    description: "Go fishing for coins",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 30,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const fishTypes = [
            { name: "🐟 Common Fish", value: 50 },
            { name: "🐠 Tropical Fish", value: 100 },
            { name: "🐡 Pufferfish", value: 200 },
            { name: "🦈 Shark", value: 500 },
            { name: "🐋 Whale", value: 1000 },
            { name: "🦑 Squid", value: 150 },
            { name: "🦀 Crab", value: 75 },
            { name: "🐚 Shell", value: 25 }
        ];
        const caught = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        profile.balance = (profile.balance ?? 0) + caught.value;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`🎣 You caught a ${caught.name} and earned ${caught.value} coins!`)] });
    },
};
export default command;
//# sourceMappingURL=fish.js.map