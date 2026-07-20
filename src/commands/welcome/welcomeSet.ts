import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { WelcomeService } from "../../services/WelcomeService.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "welcome set",
  description: "Configure welcome message settings",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 3,
  slashData: (b) =>
    (b as SlashCommandBuilder)
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
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : ctx.args[0]?.toLowerCase();

    let value: any;
    let field: keyof import("../../services/WelcomeService.js").WelcomeConfig;

    if (sub === "title") {
      field = "title";
      const text = ctx.isSlash ? ctx.interaction!.options.getString("text") : ctx.args.slice(1).join(" ");
      if (text === null || text === "") {
        value = null;
      } else {
        value = text;
      }
    } else if (sub === "description") {
      field = "description";
      const text = ctx.isSlash ? ctx.interaction!.options.getString("text") : ctx.args.slice(1).join(" ");
      if (text === null || text === "") {
        value = null;
      } else {
        value = text;
      }
    } else if (sub === "color") {
      field = "color";
      const hex = ctx.isSlash ? ctx.interaction!.options.getString("hex") : ctx.args[1];
      if (!hex || hex === "") {
        value = "#57F287";
      } else {
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          await ctx.reply({ embeds: [errorEmbed("Invalid hex color. Use format: #RRGGBB")] });
          return;
        }
        value = hex;
      }
    } else if (sub === "footer") {
      field = "footer";
      const text = ctx.isSlash ? ctx.interaction!.options.getString("text") : ctx.args.slice(1).join(" ");
      if (text === null || text === "") {
        value = null;
      } else {
        value = text;
      }
    } else if (sub === "thumbnail") {
      field = "thumbnail";
      const url = ctx.isSlash ? ctx.interaction!.options.getString("url") : ctx.args[1];
      if (!url || url === "") {
        value = null;
      } else {
        value = url;
      }
    } else if (sub === "image") {
      field = "image";
      const url = ctx.isSlash ? ctx.interaction!.options.getString("url") : ctx.args[1];
      if (!url || url === "") {
        value = null;
      } else {
        value = url;
      }
    } else if (sub === "banner") {
      field = "banner";
      const url = ctx.isSlash ? ctx.interaction!.options.getString("url") : ctx.args[1];
      if (!url || url === "") {
        value = null;
      } else {
        value = url;
      }
    } else if (sub === "background") {
      field = "background";
      const url = ctx.isSlash ? ctx.interaction!.options.getString("url") : ctx.args[1];
      if (!url || url === "") {
        value = null;
      } else {
        value = url;
      }
    } else if (sub === "autorole") {
      field = "autoroleId";
      const role = ctx.isSlash ? ctx.interaction!.options.getRole("role") : guild.roles.cache.get(ctx.args[1]?.replace(/\D/g, "") ?? "");
      if (!role) {
        value = null;
      } else {
        value = role.id;
      }
    } else if (sub === "dm") {
      field = "dmEnabled";
      const status = ctx.isSlash ? ctx.interaction!.options.getString("status", true) : ctx.args[1]?.toLowerCase();
      if (status !== "on" && status !== "off") {
        await ctx.reply({ embeds: [errorEmbed("Use: on or off")] });
        return;
      }
      value = status === "on";
    } else if (sub === "language") {
      field = "language";
      const lang = ctx.isSlash ? ctx.interaction!.options.getString("lang") : ctx.args[1];
      if (!lang || lang === "") {
        value = "en";
      } else {
        value = lang;
      }
    } else if (sub === "theme") {
      field = "theme";
      const name = ctx.isSlash ? ctx.interaction!.options.getString("name") : ctx.args[1];
      if (!name || name === "") {
        value = "default";
      } else {
        value = name;
      }
    } else if (sub === "buttons") {
      field = "buttons";
      const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "false";
      value = enabled;
    } else if (sub === "embed") {
      field = "embed";
      const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[1]?.toLowerCase() !== "false";
      value = enabled;
    } else {
      await ctx.reply({ embeds: [errorEmbed("Use: title | description | color | footer | thumbnail | image | banner | background | autorole | dm | language | theme | buttons | embed")] });
      return;
    }

    const result = await WelcomeService.updateField({ guild, field, value });
    await ctx.reply({ embeds: [result.success ? successEmbed(result.message) : errorEmbed(result.message)] });
  },
};

export default command;
