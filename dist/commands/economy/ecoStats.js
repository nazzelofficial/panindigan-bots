import { UserModel } from "@/database/models/User";
import { baseEmbed } from "@/utils/embeds";
const command = {
    name: "eco_stats",
    description: "View economy statistics",
    category: "Economy",
    access: "admin",
    guildOnly: true,
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const users = await UserModel.find().lean();
        let totalBalance = 0;
        let richestBalance = 0;
        let richestUserId = null;
        let totalUsers = 0;
        for (const user of users) {
            const profile = user.guilds?.find((g) => g.guildId === guild.id);
            if (profile) {
                totalUsers++;
                const balance = profile.balance ?? 0;
                totalBalance += balance;
                if (balance > richestBalance) {
                    richestBalance = balance;
                    richestUserId = user.userId;
                }
            }
        }
        const embed = baseEmbed("primary")
            .setTitle("📊 Economy Statistics")
            .addFields({ name: "Total Users", value: totalUsers.toString(), inline: true }, { name: "Total Coins in Circulation", value: `🪙 ${totalBalance.toLocaleString()}`, inline: true }, { name: "Richest User", value: richestUserId ? `<@${richestUserId}>` : "None", inline: true });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=ecoStats.js.map