import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "roulette",
    description: "Play roulette",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("bet").setDescription("Bet amount").setRequired(true).setMinValue(10))
        .addStringOption((o) => o.setName("choice").setDescription("Your choice").setRequired(true).addChoices({ name: "Red", value: "red" }, { name: "Black", value: "black" }, { name: "Green", value: "green" })),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const bet = ctx.isSlash ? ctx.interaction.options.getInteger("bet", true) : parseInt(ctx.args[0]);
        const choice = ctx.isSlash ? ctx.interaction.options.getString("choice", true) : ctx.args[1]?.toLowerCase();
        if (!bet || !choice)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        if (profile.balance < bet) {
            return ctx.reply({ embeds: [errorEmbed("❌ Insufficient balance")] });
        }
        const colors = ["red", "black", "green"];
        const weights = [18, 18, 2];
        const total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        let result = "";
        for (let i = 0; i < colors.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                result = colors[i];
                break;
            }
        }
        let multiplier = 0;
        if (choice === result) {
            multiplier = choice === "green" ? 14 : 2;
        }
        const winnings = Math.floor(bet * multiplier);
        profile.balance = (profile.balance ?? 0) - bet + winnings;
        await user.save();
        const colorEmoji = { red: "🔴", black: "⚫", green: "🟢" };
        if (multiplier > 0) {
            await ctx.reply({ embeds: [successEmbed(`🎲 ${colorEmoji[result]} ${result.toUpperCase()}\n🎉 You won ${winnings} coins!`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed(`🎲 ${colorEmoji[result]} ${result.toUpperCase()}\n😢 You lost ${bet} coins`)] });
        }
    },
};
export default command;
//# sourceMappingURL=roulette.js.map