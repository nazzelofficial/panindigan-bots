import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";

const command: CommandDefinition = {
  name: "config_set",
  description: "Set server configuration",
  category: "Admin",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) =>
        o.setName("setting")
          .setDescription("Setting to configure")
          .setRequired(true)
          .addChoices(
            { name: "Prefix", value: "prefix" },
            { name: "Language", value: "language" },
            { name: "Welcome Channel", value: "welcomeChannel" },
            { name: "Goodbye Channel", value: "goodbyeChannel" },
            { name: "Auto Role", value: "autoRole" },
            { name: "Log Channel", value: "logChannel" }
          )
      )
      .addStringOption((o) => o.setName("value").setDescription("Value for the setting").setRequired(true)),
  async execute(ctx) {
    const setting = ctx.isSlash ? ctx.interaction!.options.getString("setting", true) : ctx.args[0];
    const value = ctx.isSlash ? ctx.interaction!.options.getString("value", true) : ctx.args[1];

    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { [setting]: value },
      { upsert: true }
    );

    await ctx.reply({ content: `✅ Set ${setting} to ${value}` });
  },
};
export default command;
