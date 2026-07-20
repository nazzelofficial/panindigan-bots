import { UserModel } from "../../database/models/User.js";
import { baseEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";
const command = {
    name: "inventory",
    description: "View your item inventory",
    category: "Economy",
    access: "general",
    guildOnly: true,
    cooldown: 5,
    aliases: ["inv", "items", "bag"],
    slashData: (b) => b
        .addUserOption((o) => o.setName("user").setDescription("User to check (default: you)").setRequired(false)),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const target = ctx.isSlash
            ? ctx.interaction.options.getUser("user") ?? ctx.interaction.user
            : ctx.args[0]
                ? await ctx.client.users.fetch(ctx.args[0].replace(/\D/g, "")).catch(() => null)
                : await ctx.client.users.fetch(ctx.userId);
        if (!target) {
            await ctx.reply({ embeds: [errorEmbed("User not found.")] });
            return;
        }
        const doc = await UserModel.findOne({ userId: target.id }).lean();
        const profile = doc?.guilds?.find((g) => g.guildId === guild.id) ?? {};
        const inventory = profile.inventory ?? [];
        if (!inventory.length) {
            await ctx.reply({ embeds: [infoEmbed(`${target.username}'s inventory is empty.`)] });
            return;
        }
        // Aggregate by item name
        const aggregated = new Map();
        for (const item of inventory) {
            const key = item.name ?? item.itemId ?? "Unknown";
            const existing = aggregated.get(key);
            if (existing) {
                existing.quantity += item.quantity ?? 1;
            }
            else {
                aggregated.set(key, { name: item.name ?? item.itemId ?? "Unknown", quantity: item.quantity ?? 1, itemId: item.itemId ?? "" });
            }
        }
        const embed = baseEmbed("primary")
            .setTitle(`🎒 Inventory — ${target.username}`)
            .setThumbnail(target.displayAvatarURL())
            .setDescription([...aggregated.values()]
            .map((item) => `• **${item.name}** ×${item.quantity}`)
            .join("\n")
            .slice(0, 4000) || "Empty")
            .setFooter({ text: `${inventory.length} total item slot(s)` });
        await ctx.reply({ embeds: [embed] });
    },
};
export default command;
//# sourceMappingURL=inventory.js.map