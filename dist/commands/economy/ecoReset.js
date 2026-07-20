import { UserModel } from "../../database/models/User.js";
import { successEmbed } from "../../utils/embeds.js";
const command = {
    name: "eco_reset",
    description: "Reset economy for a user (admin only)",
    category: "Economy",
    access: "admin",
    guildOnly: true,
    slashData: (b) => b.addUserOption((o) => o.setName("user").setDescription("User to reset").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const targetUser = ctx.isSlash ? ctx.interaction.options.getUser("user", true) : ctx.message?.mentions.users.first();
        if (!targetUser)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: targetUser.id }, { $setOnInsert: { userId: targetUser.id } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        profile.balance = 0;
        profile.bank = 0;
        profile.inventory = [];
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Reset economy for ${targetUser.tag}`)] });
    },
};
export default command;
//# sourceMappingURL=ecoReset.js.map