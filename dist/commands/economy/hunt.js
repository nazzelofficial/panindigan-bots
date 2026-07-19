import { UserModel } from "../../database/models/User";
import { successEmbed } from "../../utils/embeds";
const command = {
    name: "hunt",
    description: "Go hunting for coins",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 30,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const animals = [
            { name: "🐇 Rabbit", value: 50 },
            { name: "🦌 Deer", value: 100 },
            { name: "🐗 Boar", value: 150 },
            { name: "🦊 Fox", value: 200 },
            { name: "🐺 Wolf", value: 300 },
            { name: "🐻 Bear", value: 500 },
            { name: "🦁 Lion", value: 700 },
            { name: "🦅 Eagle", value: 400 }
        ];
        const caught = animals[Math.floor(Math.random() * animals.length)];
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        profile.balance = (profile.balance ?? 0) + caught.value;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`🏹 You hunted a ${caught.name} and earned ${caught.value} coins!`)] });
    },
};
export default command;
//# sourceMappingURL=hunt.js.map