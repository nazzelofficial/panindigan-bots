import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "goodbye set",
  description: "Configure goodbye message settings",
  category: "Goodbye",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 3,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) => s.setName("title").setDescription("Set goodbye embed title").addStringOption((o) => o.setName("text").setDescription("Title text").setRequired(false)))
      .addSubcommand((s) => s.setName("description").setDescription("Set goodbye embed description").addStringOption((o) => o.setName("text").setDescription("Description text").setRequired(false)))
      .addSubcommand((s) => s.setName("color").setDescription("Set goodbye embed color").addStringOption((o) => o.setName("hex").setDescription("Color hex code (e.g., #ED4245)").setRequired(false)))
      .addSubcommand((s) => s.setName("footer").setDescription("Set goodbye embed footer").addStringOption((o) => o.setName("text").setDescription("Footer text").setRequired(false)))
      .addSubcommand((s) => s.setName("thumbnail").setDescription("Set goodbye embed thumbnail").addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(false)))
      .addSubcommand((s) => s.setName("image").setDescription("Set goodbye embed image").addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(false)))
      .addSubcommand((s) => s.setName("banner").setDescription("Set goodbye banner image").addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(false)))
      .addSubcommand((s) => s.setName("background").setDescription("Set goodbye card background").addStringOption((o) => o.setName("url").setDescription("Image URL").setRequired(false)))
      .addSubcommand((s) => s.setName("dm").setDescription("Enable/disable DM goodbye").addStringOption((o) => o.setName("status").setDescription("on or off").setRequired(true).addChoices({ name: "on", value: "on" }, { name: "off", value: "off" })))
      .addSubcommand((s) => s.setName("language").setDescription("Set goodbye language").addStringOption((o) => o.setName("lang").setDescription("Language code").setRequired(false)))
      .addSubcommand((s) => s.setName("theme").setDescription("Set goodbye theme").addStringOption((o) => o.setName("name").setDescription("Theme name").setRequired(false)))
      .addSubcommand((s) => s.setName("buttons").setDescription("Enable/disable goodbye buttons").addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true)))
      .addSubcommand((s) => s.setName("embed").setDescription("Enable/disable embed format").addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable").setRequired(true))),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    const update: Record<string, any> = {};

    if (sub === "title") {
      const text = ctx.isSlash ? ctx.interaction!.options.getString("text") : ctx.args.slice(1).join(" ");
      if (text === null || text === "") {
        update["goodbye.title"] = null;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "goodbye.title": "" } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Goodbye title removed.")] });
        return;
      }
      update["goodbye.title"] = text;
    } else if (sub === "description") {
      const text = ctx.isSlash ? ctx.interaction!.options.getString("text") : ctx.args.slice(1).join(" ");
      if (text === null || text === "") {
        update["goodbye.description"] = null;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "goodbye.description": "" } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Goodbye description removed.")] });
        return;
      }
      update["goodbye.description"] = text;
    } else if (sub === "color") {
      const hex = ctx.isSlash ? ctx.interaction!.options.getString("hex") : ctx.args[1];
      if (!hex || hex === "") {
        update["goodbye.color"] = "#ED4245";
      } else {
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          await ctx.reply({ embeds: [errorEmbed("Invalid hex color. Use format: #RRGGBB")] });
          return;
        }
        update["goodbye.color"] = hex;
      }
    } else if (sub === "footer") {
      const text = ctx.isSlash ? ctx.interaction!.options.getString("text") : ctx.args.slice(1).join(" ");
      if (text === null || text === "") {
        update["goodbye.footer"] = null;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "goodbye.footer": "" } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Goodbye footer removed.")] });
        return;
      }
      update["goodbye.footer"] = text;
    } else if (sub === "thumbnail") {
      const url = ctx.isSlash ? ctx.interaction!.options.getString("url") : ctx.args[1];
      if (!url || url === "") {
        update["goodbye.thumbnail"] = null;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "goodbye.thumbnail": "" } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Goodbye thumbnail removed.")] });
        return;
      }
      update["goodbye.thumbnail"] = url;
    } else if (sub === "image") {
      const url = ctx.isSlash ? ctx.interaction!.options.getString("url") : ctx.args[1];
      if (!url || url === "") {
        update["goodbye.image"] = null;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "goodbye.image": "" } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Goodbye image removed.")] });
        return;
      }
      update["goodbye.image"] = url;
    } else if (sub === "banner") {
      const url = ctx.isSlash ? ctx.interaction!.options.getString("url") : ctx.args[1];
      if (!url || url === "") {
        update["goodbye.banner"] = null;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "goodbye.banner": "" } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Goodbye banner removed.")] });
        return;
      }
      update["goodbye.banner"] = url;
    } else if (sub === "background") {
      const url = ctx.isSlash ? ctx.interaction!.options.getString("url") : ctx.args[1];
      if (!url || url === "") {
        update["goodbye.background"] = null;
        await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { "goodbye.background": "" } }, { upsert: true });
        await ctx.reply({ embeds: [successEmbed("Goodbye background removed.")] });
        return;
      }
      update["goodbye.background"] = url;
    } else if (sub === "dm") {
      const status = ctx.isSlash ? ctx.interaction!.options.getString("status", true) : ctx.args[1]?.toLowerCase();
      if (status !== "on" && status !== "off") {
        await ctx.reply({ embeds: [errorEmbed("Use: on or off")] });
        return;
      }
      update["goodbye.dmEnabled"] = status === "on";
    } else if (sub === "language") {
      const lang = ctx.isSlash ? ctx.interaction!.options.getString("lang") : ctx.args[1];
      if (!lang || lang === "") {
        update["goodbye.language"] = "en";
      } else {
        update["goodbye.language"] = lang;
      }
    } else if (sub === "theme") {
      const name = ctx.isSlash ? ctx.interaction!.options.getString("name") : ctx.args[1];
      if (!name || name === "") {
        update["goodbye.theme"] = "default";
      } else {
        update["goodbye.theme"] = name;
      }
    } else if (sub === "buttons") {
      const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "false";
      update["goodbye.buttons"] = enabled;
    } else if (sub === "embed") {
      const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "false";
      update["goodbye.embed"] = enabled;
    } else {
      await ctx.reply({ embeds: [errorEmbed("Use: title | description | color | footer | thumbnail | image | banner | background | dm | language | theme | buttons | embed")] });
      return;
    }

    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: update }, { upsert: true });
    await ctx.reply({ embeds: [successEmbed(`Goodbye ${sub} updated.`)] });
  },
};

export default command;
