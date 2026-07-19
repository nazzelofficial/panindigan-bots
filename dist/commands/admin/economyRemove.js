import { UserModel } from "../../database/models/User";
import { successEmbed } from "../../utils/embeds";
const command = {
    name: "economy_remove",
    description: "Remove money from a user",
    category: "Admin",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to remove money from").setRequired(true))
        .addIntegerOption((o) => o.setName("amount").setDescription("Amount to remove").setRequired(true).setMinValue(1)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const user = ctx.isSlash ? ctx.interaction.options.getUser("user", true) : ctx.message?.mentions.users.first();
        const amount = ctx.isSlash ? ctx.interaction.options.getInteger("amount", true) : parseInt(ctx.args[1]);
        if (!user || !amount)
            return;
        const dbUser = await UserModel.findOneAndUpdate({ userId: user.id }, { $setOnInsert: { userId: user.id } }, { upsert: true, new: true });
        let profile = dbUser.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            dbUser.guilds.push({ guildId: guild.id });
            await dbUser.save();
            profile = dbUser.guilds[dbUser.guilds.length - 1];
        }
        profile.balance = Math.max(0, (profile.balance ?? 0) - amount);
        await dbUser.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Removed 🪙 ${amount.toLocaleString()} from ${user.tag}`)] });
    },
};
export default command;
//# sourceMappingURL=economyRemove.js.map