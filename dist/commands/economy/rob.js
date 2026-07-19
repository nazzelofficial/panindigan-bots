import { UserModel } from "../../database/models/User";
import { errorEmbed, warnEmbed, baseEmbed } from "../../utils/embeds";
const ROB_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
const SUCCESS_CHANCE = 0.45;
const MIN_VICTIM_BALANCE = 100;
const command = {
    name: "rob",
    description: "Attempt to rob another user's wallet (risky!)",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to rob").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const target = ctx.isSlash
            ? ctx.interaction.options.getUser("user", true)
            : await ctx.client.users.fetch(ctx.args[0]?.replace(/\D/g, "") ?? "").catch(() => null);
        if (!target || target.bot || target.id === ctx.userId) {
            await ctx.reply({ embeds: [errorEmbed("Choose a valid target user.")] });
            return;
        }
        const robberDoc = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let robberProfile = robberDoc.guilds.find((g) => g.guildId === guild.id);
        if (!robberProfile) {
            robberDoc.guilds.push({ guildId: guild.id });
            await robberDoc.save();
            robberProfile = robberDoc.guilds[robberDoc.guilds.length - 1];
        }
        const lastRob = robberProfile.lastCrime;
        const now = Date.now();
        if (lastRob && now - lastRob.getTime() < ROB_COOLDOWN_MS) {
            const remaining = lastRob.getTime() + ROB_COOLDOWN_MS - now;
            const m = Math.floor(remaining / 60_000);
            await ctx.reply({ embeds: [errorEmbed(`You need to wait **${m}m** before robbing again.`)] });
            return;
        }
        const victimDoc = await UserModel.findOne({ userId: target.id }).lean();
        const victimProfile = victimDoc?.guilds?.find((g) => g.guildId === guild.id) ?? {};
        const victimWallet = victimProfile.balance ?? 0;
        if (victimWallet < MIN_VICTIM_BALANCE) {
            await ctx.reply({ embeds: [errorEmbed(`${target.username} doesn't have enough coins to rob (minimum: **${MIN_VICTIM_BALANCE}** 🪙).`)] });
            return;
        }
        robberProfile.lastCrime = new Date();
        const success = Math.random() < SUCCESS_CHANCE;
        if (success) {
            const pct = Math.random() * 0.2 + 0.1; // 10-30%
            const stolen = Math.floor(victimWallet * pct);
            robberProfile.balance = (robberProfile.balance ?? 0) + stolen;
            robberProfile.totalEarned = (robberProfile.totalEarned ?? 0) + stolen;
            await robberDoc.save();
            // Deduct from victim
            await UserModel.updateOne({ userId: target.id, "guilds.guildId": guild.id }, { $inc: { "guilds.$.balance": -stolen } });
            await ctx.reply({ embeds: [baseEmbed("success").setTitle("🕵️ Successful Robbery!").setDescription(`You stole **${stolen.toLocaleString()} 🪙** from ${target.username}'s wallet!`)] });
        }
        else {
            const fine = Math.floor(Math.random() * 151) + 50; // 50-200
            const wallet = robberProfile.balance ?? 0;
            robberProfile.balance = Math.max(0, wallet - fine);
            await robberDoc.save();
            await ctx.reply({ embeds: [warnEmbed(`🚔 You got caught trying to rob ${target.username}! You were fined **${fine.toLocaleString()} 🪙**.`)] });
        }
    },
};
export default command;
//# sourceMappingURL=rob.js.map