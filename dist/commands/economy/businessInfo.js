import { UserModel } from "@/database/models/User";
import { baseEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "business_info",
    description: "View your business information",
    category: "Economy",
    access: "general",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        if (!profile.business) {
            return ctx.reply({ embeds: [errorEmbed("❌ You do not have a business")] });
        }
        const level = profile.businessLevel || 1;
        const revenue = level * 1000;
        const embed = baseEmbed("primary")
            .setTitle("🏢 Business Information")
            .addFields({ name: "Name", value: profile.business, inline: true }, { name: "Level", value: level.toString(), inline: true }, { name: "Revenue/Hour", value: `🪙 ${revenue}`, inline: true }, { name: "Pending Revenue", value: `🪙 ${profile.businessRevenue || 0}`, inline: true });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=businessInfo.js.map