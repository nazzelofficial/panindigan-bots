import { UserModel } from "../../database/models/User";
import { successEmbed, errorEmbed } from "../../utils/embeds";
async function getOrCreateProfile(userId, guildId) {
    let user = await UserModel.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true, new: true });
    let profile = user.guilds.find((g) => g.guildId === guildId);
    if (!profile) {
        user.guilds.push({ guildId });
        await user.save();
        profile = user.guilds[user.guilds.length - 1];
    }
    return { user, profile };
}
const command = {
    name: "transfer",
    description: "Pay another user, deposit to bank, or withdraw from bank",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["pay", "deposit", "withdraw"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("pay")
        .setDescription("Send coins to another user")
        .addUserOption((o) => o.setName("user").setDescription("Recipient").setRequired(true))
        .addIntegerOption((o) => o.setName("amount").setDescription("Amount to send").setRequired(true).setMinValue(1)))
        .addSubcommand((s) => s
        .setName("deposit")
        .setDescription("Deposit coins from wallet to bank")
        .addStringOption((o) => o.setName("amount").setDescription("Amount or 'all'").setRequired(true)))
        .addSubcommand((s) => s
        .setName("withdraw")
        .setDescription("Withdraw coins from bank to wallet")
        .addStringOption((o) => o.setName("amount").setDescription("Amount or 'all'").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const invoked = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "pay");
        const sub = ["pay", "deposit", "withdraw"].includes(invoked) ? invoked : "pay";
        const { user: senderDoc, profile: senderProfile } = await getOrCreateProfile(ctx.userId, guild.id);
        if (sub === "pay") {
            const target = ctx.isSlash
                ? ctx.interaction.options.getUser("user", true)
                : await ctx.client.users.fetch(ctx.args[1]?.replace(/\D/g, "") ?? "").catch(() => null);
            const amount = ctx.isSlash
                ? ctx.interaction.options.getInteger("amount", true)
                : parseInt(ctx.args[2] ?? ctx.args[1] ?? "0");
            if (!target || target.bot) {
                await ctx.reply({ embeds: [errorEmbed("Valid target user required.")] });
                return;
            }
            if (target.id === ctx.userId) {
                await ctx.reply({ embeds: [errorEmbed("You can't pay yourself.")] });
                return;
            }
            if (!amount || amount < 1) {
                await ctx.reply({ embeds: [errorEmbed("Amount must be at least 1.")] });
                return;
            }
            if (senderProfile.balance < amount) {
                await ctx.reply({ embeds: [errorEmbed(`You only have 🪙 **${senderProfile.balance?.toLocaleString()}** in your wallet.`)] });
                return;
            }
            senderProfile.balance -= amount;
            await senderDoc.save();
            const { user: recipDoc, profile: recipProfile } = await getOrCreateProfile(target.id, guild.id);
            recipProfile.balance = (recipProfile.balance ?? 0) + amount;
            await recipDoc.save();
            await ctx.reply({ embeds: [successEmbed(`💸 Sent 🪙 **${amount.toLocaleString()}** to ${target.username}.`)] });
        }
        else if (sub === "deposit") {
            const rawAmount = ctx.isSlash ? ctx.interaction.options.getString("amount", true) : ctx.args[1];
            const wallet = senderProfile.balance ?? 0;
            const amount = rawAmount?.toLowerCase() === "all" ? wallet : parseInt(rawAmount ?? "0");
            if (!amount || amount < 1) {
                await ctx.reply({ embeds: [errorEmbed("Invalid amount.")] });
                return;
            }
            if (wallet < amount) {
                await ctx.reply({ embeds: [errorEmbed(`You only have 🪙 **${wallet.toLocaleString()}** in your wallet.`)] });
                return;
            }
            senderProfile.balance -= amount;
            senderProfile.bank = (senderProfile.bank ?? 0) + amount;
            await senderDoc.save();
            await ctx.reply({ embeds: [successEmbed(`🏦 Deposited 🪙 **${amount.toLocaleString()}** to your bank.`)] });
        }
        else {
            const rawAmount = ctx.isSlash ? ctx.interaction.options.getString("amount", true) : ctx.args[1];
            const bank = senderProfile.bank ?? 0;
            const amount = rawAmount?.toLowerCase() === "all" ? bank : parseInt(rawAmount ?? "0");
            if (!amount || amount < 1) {
                await ctx.reply({ embeds: [errorEmbed("Invalid amount.")] });
                return;
            }
            if (bank < amount) {
                await ctx.reply({ embeds: [errorEmbed(`You only have 🪙 **${bank.toLocaleString()}** in your bank.`)] });
                return;
            }
            senderProfile.bank -= amount;
            senderProfile.balance = (senderProfile.balance ?? 0) + amount;
            await senderDoc.save();
            await ctx.reply({ embeds: [successEmbed(`💳 Withdrew 🪙 **${amount.toLocaleString()}** from your bank.`)] });
        }
    },
};
export default command;
//# sourceMappingURL=transfer.js.map