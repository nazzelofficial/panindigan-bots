import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed, baseEmbed } from "../../utils/embeds.js";
import { config } from "../../config/config.js";

const command: CommandDefinition = {
  name: "prefix",
  description: "View or change the server's custom command prefix",
  category: "Settings",
  access: "general",
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("set").setDescription("Set a new prefix (Admin only)")
          .addStringOption((o) => o.setName("prefix").setDescription("New prefix (max 5 characters)").setRequired(true).setMaxLength(5)),
      )
      .addSubcommand((s) => s.setName("view").setDescription("View the current prefix"))
      .addSubcommand((s) => s.setName("reset").setDescription("Reset to the default prefix (Admin only)")),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "view");
    if (sub === "set") {
      const member = ctx.interaction?.member ?? ctx.message?.member;
      const hasPerms = (member as any)?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
                       (member as any)?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!hasPerms) {
        await ctx.reply({ embeds: [{ color: 0xed4245, description: "❌ You need the **Manage Server** permission to change the prefix." }], ephemeral: true });
        return;
      }
      const newPrefix = ctx.isSlash ? ctx.interaction!.options.getString("prefix", true) : ctx.args[1];
      if (!newPrefix) { await ctx.reply({ embeds: [errorEmbed("Please provide a prefix.")] }); return; }
      if (newPrefix.length > 5) { await ctx.reply({ embeds: [errorEmbed("Prefix must be 5 characters or fewer.")] }); return; }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { prefix: newPrefix } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed(`Server prefix set to \`${newPrefix}\`.`)] });
    } else if (sub === "reset") {
      const member = ctx.interaction?.member ?? ctx.message?.member;
      const hasPerms = (member as any)?.permissions?.has(PermissionFlagsBits.ManageGuild) ||
                       (member as any)?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!hasPerms) {
        await ctx.reply({ embeds: [{ color: 0xed4245, description: "❌ You need the **Manage Server** permission to reset the prefix." }], ephemeral: true });
        return;
      }
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $unset: { prefix: "" } });
      await ctx.reply({ embeds: [successEmbed(`Prefix reset to the default: \`${(config as any).prefix ?? "p!"}\`.`)] });
    } else {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const current = (cfg as any)?.prefix ?? (config as any).prefix ?? "p!";
      const embed = baseEmbed("primary")
        .setTitle("⚙️ Server Prefix")
        .addFields(
          { name: "Current Prefix", value: `\`${current}\``, inline: true },
          { name: "Slash Commands", value: "Always use `/`", inline: true },
        )
        .setFooter({ text: "Admins can change the prefix with /prefix set" });
      await ctx.reply({ embeds: [embed] });
    }
  },
};
export default command;
