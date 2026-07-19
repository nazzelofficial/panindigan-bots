import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { successEmbed, errorEmbed, warnEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "reset",
  description: "Reset all server settings to their defaults (WARNING: this cannot be undone)",
  category: "Settings",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.Administrator],
  guildOnly: true,
  cooldown: 30,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addBooleanOption((o) => o.setName("confirm").setDescription("Type true to confirm — this CANNOT be undone").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const confirmed = ctx.isSlash ? ctx.interaction!.options.getBoolean("confirm", true) : ctx.args[0]?.toLowerCase() === "confirm";
    if (!confirmed) {
      await ctx.reply({ embeds: [warnEmbed("Reset cancelled. Pass `confirm: true` to proceed. **This will erase all server configuration.**")] }); return;
    }
    await GuildModel.findOneAndDelete({ guildId: guild.id });
    await ctx.reply({ embeds: [successEmbed("All server settings have been reset to defaults. The bot is now configured as if this server is brand new.")] });
  },
};
export default command;
