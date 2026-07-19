import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "give",
    description: "Give coins to another user",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to give coins to").setRequired(true))
        .addIntegerOption((o) => o.setName("amount").setDescription("Amount to give").setRequired(true).setMinValue(1)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetUser = ctx.isSlash ? ctx.interaction.options.getUser("user", true) : ctx.message?.mentions.users.first();
        const amount = ctx.isSlash ? ctx.interaction.options.getInteger("amount", true) : parseInt(ctx.args[1]);
        if (!targetUser || !amount)
            return;
        if (targetUser.id === ctx.userId) {
            return ctx.reply({ embeds: [errorEmbed("❌ You cannot give coins to yourself")] });
        }
        const sender = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let senderProfile = sender.guilds.find((g) => g.guildId === guild.id);
        if (!senderProfile) {
            sender.guilds.push({ guildId: guild.id });
            await sender.save();
            senderProfile = sender.guilds[sender.guilds.length - 1];
        }
        if (senderProfile.balance < amount) {
            return ctx.reply({ embeds: [errorEmbed("❌ Insufficient balance")] });
        }
        senderProfile.balance = (senderProfile.balance ?? 0) - amount;
        await sender.save();
        const receiver = await UserModel.findOneAndUpdate({ userId: targetUser.id }, { $setOnInsert: { userId: targetUser.id } }, { upsert: true, new: true });
        let receiverProfile = receiver.guilds.find((g) => g.guildId === guild.id);
        if (!receiverProfile) {
            receiver.guilds.push({ guildId: guild.id });
            await receiver.save();
            receiverProfile = receiver.guilds[receiver.guilds.length - 1];
        }
        receiverProfile.balance = (receiverProfile.balance ?? 0) + amount;
        await receiver.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Gave ${amount} coins to ${targetUser.tag}`)] });
    },
};
export default command;
//# sourceMappingURL=give.js.map