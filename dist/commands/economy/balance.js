import { UserModel } from "@/database/models/User";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "balance",
    description: "View your or another user's coin balance",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["bal", "coins", "wallet"],
    slashData: (b) => b.addUserOption((o) => o.setName("user").setDescription("User to check").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const target = ctx.isSlash
            ? ctx.interaction.options.getUser("user") ?? ctx.interaction.user
            : ctx.args[0]
                ? await ctx.client.users.fetch(ctx.args[0].replace(/\D/g, "")).catch(() => null)
                : await ctx.client.users.fetch(ctx.userId);
        if (!target) {
            await ctx.reply({ embeds: [errorEmbed("User not found.")] });
            return;
        }
        const doc = await UserModel.findOne({ userId: target.id }).lean();
        const guildData = doc?.guilds?.find((g) => g.guildId === guild.id) ?? {};
        const wallet = guildData.balance ?? 0;
        const bank = guildData.bank ?? 0;
        const embed = baseEmbed("primary")
            .setTitle(`💰 Balance — ${target.username}`)
            .setThumbnail(target.displayAvatarURL())
            .addFields({ name: "👛 Wallet", value: `🪙 **${wallet.toLocaleString()}**`, inline: true }, { name: "🏦 Bank", value: `🪙 **${bank.toLocaleString()}**`, inline: true }, { name: "💎 Net Worth", value: `🪙 **${(wallet + bank).toLocaleString()}**`, inline: true });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=balance.js.map