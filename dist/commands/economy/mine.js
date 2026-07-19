import { UserModel } from "@/database/models/User";
import { errorEmbed, baseEmbed } from "@/utils/embeds";
const ORES = [
    { name: "🪨 Stone", value: 10, weight: 40 },
    { name: "⛏️ Coal", value: 50, weight: 25 },
    { name: "🔩 Iron", value: 100, weight: 15 },
    { name: "🥇 Gold", value: 300, weight: 10 },
    { name: "💎 Diamond", value: 500, weight: 6 },
    { name: "🔮 Emerald", value: 700, weight: 3 },
    { name: "💜 Amethyst", value: 1000, weight: 1 },
];
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
function weightedRandom() {
    const total = ORES.reduce((sum, o) => sum + o.weight, 0);
    let roll = Math.random() * total;
    for (const ore of ORES) {
        roll -= ore.weight;
        if (roll <= 0)
            return ore;
    }
    return ORES[0];
}
const command = {
    name: "mine",
    description: "Go mining for ores and coins (5 min cooldown)",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
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
        const lastMine = profile.lastMine ?? null;
        const now = Date.now();
        if (lastMine && now - lastMine.getTime() < COOLDOWN_MS) {
            const remaining = lastMine.getTime() + COOLDOWN_MS - now;
            const mins = Math.ceil(remaining / 60000);
            return ctx.reply({ embeds: [errorEmbed(`⛏️ Your pickaxe is tired! Come back in **${mins} minute(s)**.`)] });
        }
        profile.lastMine = new Date();
        const ore = weightedRandom();
        profile.balance = (profile.balance ?? 0) + ore.value;
        await user.save();
        const embed = baseEmbed("primary")
            .setTitle("⛏️ Mining Result")
            .setDescription(`You ventured into the mines and discovered...\n\n**${ore.name}**`)
            .addFields({ name: "💰 Coins Earned", value: `+${ore.value.toLocaleString()}`, inline: true }, { name: "💼 Balance", value: `🪙 **${(profile.balance).toLocaleString()}**`, inline: true })
            .setFooter({ text: "Next mine available in 5 minutes" });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=mine.js.map