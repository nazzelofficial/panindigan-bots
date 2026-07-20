import { UserModel } from "../../database/models/User.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "business_create",
    description: "Create a business",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("name").setDescription("Business name").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[0];
        if (!name)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        if (profile.business) {
            return ctx.reply({ embeds: [errorEmbed("❌ You already have a business")] });
        }
        const cost = 50000;
        if (profile.balance < cost) {
            return ctx.reply({ embeds: [errorEmbed(`❌ You need ${cost} coins to create a business`)] });
        }
        profile.balance = (profile.balance ?? 0) - cost;
        profile.business = name;
        profile.businessLevel = 1;
        profile.businessRevenue = 0;
        await user.save();
        await ctx.reply({ embeds: [successEmbed(`✅ Created business: ${name}`)] });
    },
};
export default command;
//# sourceMappingURL=businessCreate.js.map