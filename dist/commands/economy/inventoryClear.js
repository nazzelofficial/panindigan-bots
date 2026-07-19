import { UserModel } from "../../database/models/User";
import { successEmbed } from "../../utils/embeds";
const command = {
    name: "inventory_clear",
    description: "Clear your inventory",
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
        profile.inventory = [];
        await user.save();
        await ctx.reply({ embeds: [successEmbed("✅ Inventory cleared")] });
    },
};
export default command;
//# sourceMappingURL=inventoryClear.js.map