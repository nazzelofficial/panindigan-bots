import { UserModel } from "@/database/models/User";
import { successEmbed } from "@/utils/embeds";
const command = {
    name: "eco_set",
    description: "Set user balance to specific amount (admin only)",
    category: "Economy",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to set balance for").setRequired(true))
        .addIntegerOption((o) => o.setName("amount").setDescription("Amount to set").setRequired(true).setMinValue(0)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetUser = ctx.isSlash ? ctx.interaction.options.getUser("user", true) : ctx.message?.mentions.users.first();
        const amount = ctx.isSlash ? ctx.interaction.options.getInteger("amount", true) : parseInt(ctx.args[1]);
        if (!targetUser || amount === null)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: targetUser.id }, { $setOnInsert: { userId: targetUser.id } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        profile.balance = amount;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Set ${targetUser.tag}'s balance to ${amount} coins`)] });
    },
};
export default command;
//# sourceMappingURL=ecoSet.js.map