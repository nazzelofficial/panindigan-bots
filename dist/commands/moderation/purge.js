import { PermissionFlagsBits, ChannelType } from "discord.js";
import { successEmbed, errorEmbed } from "@/utils/embeds";
const command = {
    name: "purge",
    description: "Bulk-delete messages in a channel",
    category: "Moderation",
    access: "moderator",
    memberPermissions: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages],
    guildOnly: true,
    cooldown: 5,
    aliases: ["clear", "prune"],
    slashData: (b) => b
        .addIntegerOption((o) => o.setName("amount").setDescription("Number of messages to delete (1-100)").setRequired(true).setMinValue(1).setMaxValue(100))
        .addUserOption((o) => o.setName("user").setDescription("Only delete messages from this user").setRequired(false))
        .addStringOption((o) => o.setName("filter").setDescription("Filter: bots, humans, pins, embeds").setRequired(false)
        .addChoices({ name: "bots", value: "bots" }, { name: "humans", value: "humans" }, { name: "embeds", value: "embeds" })),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const channel = ctx.interaction?.channel ?? ctx.message?.channel;
        if (!channel?.isTextBased() || channel.type !== ChannelType.GuildText) {
            await ctx.reply({ embeds: [errorEmbed("Use this in a text channel.")] });
            return;
        }
        const amount = ctx.isSlash ? ctx.interaction.options.getInteger("amount", true) : parseInt(ctx.args[0] ?? "0");
        const targetUser = ctx.isSlash ? ctx.interaction.options.getUser("user") : null;
        const filter = ctx.isSlash ? ctx.interaction.options.getString("filter") : null;
        if (!amount || amount < 1 || amount > 100) {
            await ctx.reply({ embeds: [errorEmbed("Amount must be between 1 and 100.")] });
            return;
        }
        const messages = await channel.messages.fetch({ limit: 100 });
        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        let filtered = [...messages.values()]
            .filter((m) => m.createdTimestamp > twoWeeksAgo)
            .slice(0, amount);
        if (targetUser)
            filtered = filtered.filter((m) => m.author.id === targetUser.id);
        if (filter === "bots")
            filtered = filtered.filter((m) => m.author.bot);
        if (filter === "humans")
            filtered = filtered.filter((m) => !m.author.bot);
        if (filter === "embeds")
            filtered = filtered.filter((m) => m.embeds.length > 0);
        const deleted = await channel.bulkDelete(filtered, true);
        const reply = await ctx.reply({ embeds: [successEmbed(`🗑️ Deleted **${deleted.size}** message(s).`)] });
        setTimeout(() => { reply?.delete?.().catch(() => { }); }, 5000);
    },
};
export default command;
//# sourceMappingURL=purge.js.map