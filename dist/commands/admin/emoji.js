import { PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds";
const command = {
    name: "emoji",
    description: "Manage server emojis — add, delete, rename, list, or view emoji info",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuildExpressions],
    botPermissions: [PermissionFlagsBits.ManageGuildExpressions],
    guildOnly: true,
    cooldown: 5,
    aliases: ["emojis", "manageemoji"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("add")
        .setDescription("Add a custom emoji to the server from a URL or attachment")
        .addStringOption((o) => o.setName("name").setDescription("Emoji name (alphanumeric, underscores only)").setRequired(true))
        .addStringOption((o) => o.setName("url").setDescription("Image URL (PNG, JPG, GIF, or WebP)").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Audit log reason").setRequired(false)))
        .addSubcommand((s) => s
        .setName("delete")
        .setDescription("Delete a custom emoji from the server")
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji name or ID to delete").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Audit log reason").setRequired(false)))
        .addSubcommand((s) => s
        .setName("rename")
        .setDescription("Rename an existing custom emoji")
        .addStringOption((o) => o.setName("emoji").setDescription("Current emoji name or ID").setRequired(true))
        .addStringOption((o) => o.setName("name").setDescription("New emoji name").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Audit log reason").setRequired(false)))
        .addSubcommand((s) => s
        .setName("list")
        .setDescription("List all custom emojis in this server")
        .addIntegerOption((o) => o.setName("page").setDescription("Page number").setRequired(false).setMinValue(1)))
        .addSubcommand((s) => s
        .setName("info")
        .setDescription("View details about a specific emoji")
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji name or ID").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        const reason = (ctx.isSlash ? ctx.interaction.options.getString("reason") : null) ?? `Emoji action by ${ctx.userId}`;
        function resolveEmoji(query) {
            const id = query.replace(/\D/g, "");
            return guild.emojis.cache.find((e) => e.id === id || e.name?.toLowerCase() === query.toLowerCase()) ?? null;
        }
        if (sub === "add") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            const url = ctx.isSlash ? ctx.interaction.options.getString("url", true) : ctx.args[2];
            if (!name || !url) {
                await ctx.reply({ embeds: [errorEmbed("Please provide a name and image URL.")] });
                return;
            }
            if (!/^[a-zA-Z0-9_]{2,32}$/.test(name)) {
                await ctx.reply({ embeds: [errorEmbed("Emoji name must be 2–32 characters: letters, numbers, and underscores only.")] });
                return;
            }
            if (guild.emojis.cache.size >= guild.maximumEmojis) {
                await ctx.reply({ embeds: [errorEmbed(`This server has reached its emoji limit (${guild.maximumEmojis}).`)] });
                return;
            }
            try {
                const emoji = await guild.emojis.create({ name, attachment: url, reason });
                await ctx.reply({ embeds: [successEmbed(`Emoji ${emoji} **:${emoji.name}:** added successfully.`)] });
            }
            catch (err) {
                await ctx.reply({ embeds: [errorEmbed(`Failed to add emoji: ${err.message}`)] });
            }
            return;
        }
        if (sub === "delete") {
            const query = ctx.isSlash ? ctx.interaction.options.getString("emoji", true) : ctx.args[1];
            if (!query) {
                await ctx.reply({ embeds: [errorEmbed("Please specify the emoji to delete.")] });
                return;
            }
            const emoji = resolveEmoji(query);
            if (!emoji) {
                await ctx.reply({ embeds: [errorEmbed(`Emoji \`${query}\` not found in this server.`)] });
                return;
            }
            const name = emoji.name;
            await emoji.delete(reason);
            await ctx.reply({ embeds: [successEmbed(`Emoji **:${name}:** has been deleted.`)] });
            return;
        }
        if (sub === "rename") {
            const query = ctx.isSlash ? ctx.interaction.options.getString("emoji", true) : ctx.args[1];
            const newName = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[2];
            if (!query || !newName) {
                await ctx.reply({ embeds: [errorEmbed("Please provide the emoji and new name.")] });
                return;
            }
            if (!/^[a-zA-Z0-9_]{2,32}$/.test(newName)) {
                await ctx.reply({ embeds: [errorEmbed("Emoji name must be 2–32 characters: letters, numbers, and underscores only.")] });
                return;
            }
            const emoji = resolveEmoji(query);
            if (!emoji) {
                await ctx.reply({ embeds: [errorEmbed(`Emoji \`${query}\` not found in this server.`)] });
                return;
            }
            const oldName = emoji.name;
            await emoji.edit({ name: newName, reason });
            await ctx.reply({ embeds: [successEmbed(`Emoji renamed from **:${oldName}:** to ${emoji} **:${newName}:**`)] });
            return;
        }
        if (sub === "list") {
            const page = Math.max(1, (ctx.isSlash ? ctx.interaction.options.getInteger("page") ?? 1 : parseInt(ctx.args[1] ?? "1") || 1));
            const emojis = [...guild.emojis.cache.values()];
            const perPage = 20;
            const totalPages = Math.max(1, Math.ceil(emojis.length / perPage));
            const slice = emojis.slice((page - 1) * perPage, page * perPage);
            const embed = baseEmbed("primary")
                .setTitle(`😀 Server Emojis — ${guild.name}`)
                .setDescription(slice.length ? slice.map((e) => `${e} \`:${e.name}:\``).join("  ") : "No custom emojis.")
                .setFooter({ text: `${emojis.length} total emojis • Page ${page}/${totalPages}` });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        if (sub === "info") {
            const query = ctx.isSlash ? ctx.interaction.options.getString("emoji", true) : ctx.args[1];
            if (!query) {
                await ctx.reply({ embeds: [errorEmbed("Please specify an emoji.")] });
                return;
            }
            const emoji = resolveEmoji(query);
            if (!emoji) {
                await ctx.reply({ embeds: [errorEmbed(`Emoji \`${query}\` not found in this server.`)] });
                return;
            }
            const embed = baseEmbed("primary")
                .setTitle(`${emoji} Emoji Info`)
                .addFields({ name: "Name", value: `:${emoji.name}:`, inline: true }, { name: "ID", value: emoji.id, inline: true }, { name: "Animated", value: emoji.animated ? "Yes" : "No", inline: true }, { name: "Created", value: `<t:${Math.floor(emoji.createdTimestamp / 1000)}:R>`, inline: true }, { name: "URL", value: emoji.url, inline: false });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: add | delete | rename | list | info")] });
    },
};
export default command;
//# sourceMappingURL=emoji.js.map