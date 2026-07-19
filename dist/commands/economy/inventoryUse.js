import { UserModel } from "@/database/models/User";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "inventory_use",
    description: "Use an item from your inventory",
    category: "Economy",
    access: "general",
    guildOnly: true,
    slashData: (b) => b.addStringOption((o) => o.setName("item").setDescription("Item name").setRequired(true)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const item = ctx.isSlash ? ctx.interaction.options.getString("item", true) : ctx.args[0];
        if (!item)
            return;
        const user = await UserModel.findOneAndUpdate({ userId: ctx.userId }, { $setOnInsert: { userId: ctx.userId } }, { upsert: true, new: true });
        let profile = user.guilds.find((g) => g.guildId === guild.id);
        if (!profile) {
            user.guilds.push({ guildId: guild.id });
            await user.save();
            profile = user.guilds[user.guilds.length - 1];
        }
        const inventory = profile.inventory ?? [];
        const itemIndex = inventory.findIndex((i) => i.name === item || i.itemId === item);
        if (itemIndex === -1) {
            return ctx.reply({ embeds: [errorEmbed("❌ You do not own this item")] });
        }
        await ctx.reply({ embeds: [successEmbed(`✅ Used ${item}`)] });
    },
};
export default command;
//# sourceMappingURL=inventoryUse.js.map