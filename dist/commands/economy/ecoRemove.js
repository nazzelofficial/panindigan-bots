import { UserModel } from "../../database/models/User";
import { successEmbed } from "../../utils/embeds";
const command = {
    name: "eco_remove",
    description: "Remove coins from a user (admin only)",
    category: "Economy",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to remove coins from").setRequired(true))
        .addIntegerOption((o) => o.setName("amount").setDescription("Amount to remove").setRequired(true).setMinValue(1)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetUser = ctx.isSlash ? ctx.interaction.options.getUser("user", true) : ctx.message?.mentions.users.first();
        const amount = ctx.isSlash ? ctx.interaction.options.getInteger("amount", true) : parseInt(ctx.args[1]);
        if (!targetUser || !amount)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: targetUser.id }, { $setOnInsert: { userId: targetUser.id } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        profile.balance = Math.max(0, (profile.balance ?? 0) - amount);
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Removed ${amount} coins from ${targetUser.tag}`)] });
    },
};
export default command;
//# sourceMappingURL=ecoRemove.js.map