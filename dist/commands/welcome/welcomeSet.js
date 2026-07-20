import { PermissionFlagsBits } from "discord.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";
const command = {
    name: "welcome set",
    description: "Configure welcome message settings",
    category: "Welcome",
    access: "admin",
    memberPermissions: [PermissionFlagsBits.ManageGuild],
    cooldown: 3,
    slashData: (b) => b
        .addSubcommand((s) => s.setName("title").setDescription("Set welcome embed title").addStringOption((o) => o.setName("text").setDescription("Title text").setRequired(false)))
        .addSubcommand((s) => s.setName("description").setDescription("Set welcome embed description").addStringOption((o) => o.setName("text").setDescription("Description text").setRequired(false)))
        .addSubcommand((s) => s.setName("color").setDescription("Set welcome embed color").addStringOption((o) => o.setName("hex").setDescription("Color hex code (e.g., #57F287)").setRequired(false)))
        .addSubcommand((s) => s.setName("footer").setDescription("Set welcome embed footer").addStringOption((o) => o.setName("text").setDescription("Footer text").setRequired(false)))
        .addSubcommand((s) => s.setName("thumbnail").setDescription("Set welcome embed thumbnail").addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(false)))
        .addSubcommand((s) => s.setName("image").setDescription("Set welcome embed image").addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(false)))
        .addSubcommand((s) => s.setName("banner").setDescription("Set welcome banner image").addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(false)))
        .addSubcommand((s) => s.setName("background").setDescription("Set welcome card background").addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(false)))
        .addSubcommand((s) => s.setName("autorole").setDescription("Set welcome autorole").addRoleOption((o) => o.setName("role").setDescription("Role to assign").setRequired(false)))
        .addSubcommand((s) => s.setName("dm").setDescription("Enable/disable DM welcome").addStringOption((o) => o.setName("status").setDescription("on or off").setRequired(true).addChoices({ name: "on", value: "on" }, { name: "off", value: "off" })))
        .addSubcommand((s) => s.setName("language").setDescription("Set welcome language").addStringOption((o) => o.setName("lang").setDescription("Language code").setRequired(false)))
        .addSubcommand((s) => s.setName("theme").setDescription("Set welcome theme").addStringOption((o) => o.setName("name").setDescription("Theme name").setRequired(false)))
        .addSubcommand((s) => s.setName("buttons").setDescription("Enable/disable welcome buttons").addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
        .addSubcommand((s) => s.setName("embed").setDescription("Enable/disable embed format").addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true))),
    async execute(ctx) {
        const guild = ctx.interaction?.guild ?? ctx.message?.guild;
        if (!guild)
            return;
        const sub = ctx.isSlash ? ctx.interaction.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();
        const update = {};
        if (sub === "title") {
            const text = ctx.isSlash ? ctx.interaction.options.getString("text") : ctx.args.slice(1).join(" ");
            if (text === null || text === "") {
                update["welcome.title"] = null;
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "welcome.title": "" } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed("Welcome title removed.")] });
                return;
            }
            update["welcome.title"] = text;
        }
        else if (sub === "description") {
            const text = ctx.isSlash ? ctx.interaction.options.getString("text") : ctx.args.slice(1).join(" ");
            if (text === null || text === "") {
                update["welcome.description"] = null;
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "welcome.description": "" } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed("Welcome description removed.")] });
                return;
            }
            update["welcome.description"] = text;
        }
        else if (sub === "color") {
            const hex = ctx.isSlash ? ctx.interaction.options.getString("hex") : ctx.args[1];
            if (!hex || hex === "") {
                update["welcome.color"] = "#57F287";
            }
            else {
                if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                    await ctx.reply({ embeds: [errorEmbed("Invalid hex color. Use format: #RRGGBB")] });
                    return;
                }
                update["welcome.color"] = hex;
            }
        }
        else if (sub === "footer") {
            const text = ctx.isSlash ? ctx.interaction.options.getString("text") : ctx.args.slice(1).join(" ");
            if (text === null || text === "") {
                update["welcome.footer"] = null;
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "welcome.footer": "" } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed("Welcome footer removed.")] });
                return;
            }
            update["welcome.footer"] = text;
        }
        else if (sub === "thumbnail") {
            const url = ctx.isSlash ? ctx.interaction.options.getString("url") : ctx.args[1];
            if (!url || url === "") {
                update["welcome.thumbnail"] = null;
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "welcome.thumbnail": "" } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed("Welcome thumbnail removed.")] });
                return;
            }
            update["welcome.thumbnail"] = url;
        }
        else if (sub === "image") {
            const url = ctx.isSlash ? ctx.interaction.options.getString("url") : ctx.args[1];
            if (!url || url === "") {
                update["welcome.image"] = null;
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "welcome.image": "" } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed("Welcome image removed.")] });
                return;
            }
            update["welcome.image"] = url;
        }
        else if (sub === "banner") {
            const url = ctx.isSlash ? ctx.interaction.options.getString("url") : ctx.args[1];
            if (!url || url === "") {
                update["welcome.banner"] = null;
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "welcome.banner": "" } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed("Welcome banner removed.")] });
                return;
            }
            update["welcome.banner"] = url;
        }
        else if (sub === "background") {
            const url = ctx.isSlash ? ctx.interaction.options.getString("url") : ctx.args[1];
            if (!url || url === "") {
                update["welcome.background"] = null;
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "welcome.background": "" } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed("Welcome background removed.")] });
                return;
            }
            update["welcome.background"] = url;
        }
        else if (sub === "autorole") {
            const role = ctx.isSlash ? ctx.interaction.options.getRole("role") : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
            if (!role) {
                update["welcome.autoroleId"] = null;
                await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "welcome.autoroleId": "" } }, { upsert: true });
                await ctx.reply({ embeds: [successEmbed("Welcome autorole removed.")] });
                return;
            }
            update["welcome.autoroleId"] = role.id;
        }
        else if (sub === "dm") {
            const status = ctx.isSlash ? ctx.interaction.options.getString("status", true) : ctx.args[1]?.toLowerCase();
            if (status !== "on" && status !== "off") {
                await ctx.reply({ embeds: [errorEmbed("Use: on or off")] });
                return;
            }
            update["welcome.dmEnabled"] = status === "on";
        }
        else if (sub === "language") {
            const lang = ctx.isSlash ? ctx.interaction.options.getString("lang") : ctx.args[1];
            if (!lang || lang === "") {
                update["welcome.language"] = "en";
            }
            else {
                update["welcome.language"] = lang;
            }
        }
        else if (sub === "theme") {
            const name = ctx.isSlash ? ctx.interaction.options.getString("name") : ctx.args[1];
            if (!name || name === "") {
                update["welcome.theme"] = "default";
            }
            else {
                update["welcome.theme"] = name;
            }
        }
        else if (sub === "buttons") {
            const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "false";
            update["welcome.buttons"] = enabled;
        }
        else if (sub === "embed") {
            const enabled = ctx.isSlash ? ctx.interaction.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "false";
            update["welcome.embed"] = enabled;
        }
        else {
            await ctx.reply({ embeds: [errorEmbed("Use: title | description | color | footer | thumbnail | image | banner | background | autorole | dm | language | theme | buttons | embed")] });
            return;
        }
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: update }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed(`Welcome ${sub} updated.`)] });
    },
};
export default command;
//# sourceMappingURL=welcomeSet.js.map