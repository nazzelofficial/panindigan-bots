import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "welcometoggle",
  description: "Enable or disable welcome messages",
  category: "Welcome",
  access: "admin",
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addBooleanOption((o) => o.setName("enabled").setDescription("Enable or disable welcome messages").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const enabled = ctx.isSlash ? ctx.interaction!.options.getBoolean("enabled", true) : ctx.args[0]?.toLowerCase() !== "off";
    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    if (enabled && !(cfg as any)?.welcome?.channelId) {
      await ctx.reply({ embeds: [errorEmbed("Set a welcome channel first using `welcomechannel` or `welcomesetup`.")] }); return;
    }
    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "welcome.enabled": enabled } }, { upsert: true });
    await ctx.reply({ embeds: [successEmbed(`Welcome messages **${enabled ? "enabled" : "disabled"}**.`)] });
  },
};
export default command;
