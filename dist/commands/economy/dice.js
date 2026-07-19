import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "dice",
    description: "Roll dice",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("bet").setDescription("Bet amount").setRequired(true).setMinValue(10))
        .addIntegerOption((o) => o.setName("number").setDescription("Your number (1-6)").setRequired(true).setMinValue(1).setMaxValue(6)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const bet = ctx.isSlash ? ctx.interaction.options.getInteger("bet", true) : parseInt(ctx.args[0]);
        const number = ctx.isSlash ? ctx.interaction.options.getInteger("number", true) : parseInt(ctx.args[1]);
        if (!bet || !number)
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
        const result = Math.floor(Math.random() * 6) + 1;
        const won = number === result;
        const winnings = won ? bet * 5 : 0;
        profile.balance = (profile.balance ?? 0) - bet + winnings;
        await user.save();
        if (won) {
            await ctx.reply({ embeds: [successEmbed(`🎲 You rolled ${result}\n🎉 You won ${winnings} coins!`)] });
        }
        else {
            await ctx.reply({ embeds: [errorEmbed(`🎲 You rolled ${result}\n😢 You lost ${bet} coins`)] });
        }
    },
};
export default command;
//# sourceMappingURL=dice.js.map