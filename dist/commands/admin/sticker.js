import { PermissionFlagsBits, StickerFormatType } from "discord.js";
import { successEmbed, errorEmbed, baseEmbed } from "@/utils/embeds";
const command = {
    name: "sticker",
    description: "Manage server stickers — add, delete, rename, list, or view sticker info",
    category: "Admin",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuildExpressions],
    botPermissions: [PermissionFlagsBits.ManageGuildExpressions],
    guildOnly: true,
    cooldown: 5,
    aliases: ["stickers", "managesticker"],
    slashData: (b) => b
        .addSubcommand((s) => s
        .setName("add")
        .setDescription("Add a custom sticker to the server from a URL")
        .addStringOption((o) => o.setName("name").setDescription("Sticker name (2–30 characters)").setRequired(true))
        .addStringOption((o) => o.setName("url").setDescription("Sticker image URL (PNG, APNG, or GIF)").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Related emoji for the sticker").setRequired(true))
        .addStringOption((o) => o.setName("description").setDescription("Short sticker description").setRequired(false))
        .addStringOption((o) => o.setName("reason").setDescription("Audit log reason").setRequired(false)))
        .addSubcommand((s) => s
        .setName("delete")
        .setDescription("Delete a custom sticker from the server")
        .addStringOption((o) => o.setName("sticker").setDescription("Sticker name or ID to delete").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Audit log reason").setRequired(false)))
        .addSubcommand((s) => s
        .setName("rename")
        .setDescription("Rename an existing custom sticker")
        .addStringOption((o) => o.setName("sticker").setDescription("Current sticker name or ID").setRequired(true))
        .addStringOption((o) => o.setName("name").setDescription("New sticker name").setRequired(true))
        .addStringOption((o) => o.setName("reason").setDescription("Audit log reason").setRequired(false)))
        .addSubcommand((s) => s
        .setName("list")
        .setDescription("List all custom stickers in this server")
        .addIntegerOption((o) => o.setName("page").setDescription("Page number").setRequired(false).setMinValue(1)))
        .addSubcommand((s) => s
        .setName("info")
        .setDescription("View details about a specific sticker")
        .addStringOption((o) => o.setName("sticker").setDescription("Sticker name or ID").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        const reason = (ctx.isSlash ? ctx.interaction.options.getString("reason") : null) ?? `Sticker action by ${ctx.userId}`;
        function resolveSticker(query) {
            const id = query.replace(/\D/g, "");
            return guild.stickers.cache.find((s) => s.id === id || s.name.toLowerCase() === query.toLowerCase()) ?? null;
        }
        if (sub === "add") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[1];
            const url = ctx.isSlash ? ctx.interaction.options.getString("url", true) : ctx.args[2];
            const emoji = ctx.isSlash ? ctx.interaction.options.getString("emoji", true) : ctx.args[3];
            const description = (ctx.isSlash ? ctx.interaction.options.getString("description") : ctx.args[4]) ?? name;
            if (!name || !url || !emoji) {
                await ctx.reply({ embeds: [errorEmbed("Please provide a name, image URL, and related emoji.")] });
                return;
            }
            if (name.length < 2 || name.length > 30) {
                await ctx.reply({ embeds: [errorEmbed("Sticker name must be 2–30 characters.")] });
                return;
            }
            if (guild.stickers.cache.size >= guild.maximumStickers) {
                await ctx.reply({ embeds: [errorEmbed(`This server has reached its sticker limit (${guild.maximumStickers}).`)] });
                return;
            }
            try {
                const sticker = await guild.stickers.create({ name, file: url, tags: emoji, description, reason });
                await ctx.reply({ embeds: [successEmbed(`Sticker **${sticker.name}** added successfully.`)] });
            }
            catch (err) {
                await ctx.reply({ embeds: [errorEmbed(`Failed to add sticker: ${err.message}`)] });
            }
            return;
        }
        if (sub === "delete") {
            const query = ctx.isSlash ? ctx.interaction.options.getString("sticker", true) : ctx.args[1];
            if (!query) {
                await ctx.reply({ embeds: [errorEmbed("Please specify the sticker to delete.")] });
                return;
            }
            const sticker = resolveSticker(query);
            if (!sticker) {
                await ctx.reply({ embeds: [errorEmbed(`Sticker \`${query}\` not found in this server.`)] });
                return;
            }
            const name = sticker.name;
            await sticker.delete(reason);
            await ctx.reply({ embeds: [successEmbed(`Sticker **${name}** has been deleted.`)] });
            return;
        }
        if (sub === "rename") {
            const query = ctx.isSlash ? ctx.interaction.options.getString("sticker", true) : ctx.args[1];
            const newName = ctx.isSlash ? ctx.interaction.options.getString("name", true) : ctx.args[2];
            if (!query || !newName) {
                await ctx.reply({ embeds: [errorEmbed("Please provide the sticker and new name.")] });
                return;
            }
            if (newName.length < 2 || newName.length > 30) {
                await ctx.reply({ embeds: [errorEmbed("Sticker name must be 2–30 characters.")] });
                return;
            }
            const sticker = resolveSticker(query);
            if (!sticker) {
                await ctx.reply({ embeds: [errorEmbed(`Sticker \`${query}\` not found.`)] });
                return;
            }
            const oldName = sticker.name;
            await sticker.edit({ name: newName, reason });
            await ctx.reply({ embeds: [successEmbed(`Sticker renamed from **${oldName}** to **${newName}**.`)] });
            return;
        }
        if (sub === "list") {
            const page = Math.max(1, (ctx.isSlash ? ctx.interaction.options.getInteger("page") ?? 1 : parseInt(ctx.args[1] ?? "1") || 1));
            const stickers = [...guild.stickers.cache.values()];
            const perPage = 15;
            const totalPages = Math.max(1, Math.ceil(stickers.length / perPage));
            const slice = stickers.slice((page - 1) * perPage, page * perPage);
            const fmt = (f) => ({ [StickerFormatType.PNG]: "PNG", [StickerFormatType.APNG]: "APNG", [StickerFormatType.Lottie]: "Lottie", [StickerFormatType.GIF]: "GIF" }[f] ?? "Unknown");
            const embed = baseEmbed("primary")
                .setTitle(`🎭 Server Stickers — ${guild.name}`)
                .setDescription(slice.length ? slice.map((s) => `**${s.name}** (${fmt(s.format)}) — \`${s.id}\``).join("\n") : "No custom stickers.")
                .setFooter({ text: `${stickers.length} total stickers • Page ${page}/${totalPages}` });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        if (sub === "info") {
            const query = ctx.isSlash ? ctx.interaction.options.getString("sticker", true) : ctx.args[1];
            if (!query) {
                await ctx.reply({ embeds: [errorEmbed("Please specify a sticker.")] });
                return;
            }
            const sticker = resolveSticker(query);
            if (!sticker) {
                await ctx.reply({ embeds: [errorEmbed(`Sticker \`${query}\` not found.`)] });
                return;
            }
            const fmt = (f) => ({ [StickerFormatType.PNG]: "PNG", [StickerFormatType.APNG]: "APNG", [StickerFormatType.Lottie]: "Lottie", [StickerFormatType.GIF]: "GIF" }[f] ?? "Unknown");
            const embed = baseEmbed("primary")
                .setTitle(`🎭 Sticker: ${sticker.name}`)
                .addFields({ name: "Name", value: sticker.name, inline: true }, { name: "ID", value: sticker.id, inline: true }, { name: "Format", value: fmt(sticker.format), inline: true }, { name: "Tags (emoji)", value: sticker.tags ?? "None", inline: true }, { name: "Created", value: `<t:${Math.floor(sticker.createdTimestamp / 1000)}:R>`, inline: true }, { name: "Description", value: sticker.description ?? "None", inline: false }, { name: "URL", value: sticker.url, inline: false });
            await ctx.reply({ embeds: [embed] });
            return;
        }
        await ctx.reply({ embeds: [errorEmbed("Unknown subcommand. Use: add | delete | rename | list | info")] });
    },
};
export default command;
//# sourceMappingURL=sticker.js.map