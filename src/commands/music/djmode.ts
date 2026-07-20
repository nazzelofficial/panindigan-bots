import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "djmode",
  description: "⭐ Toggle DJ mode — only members with the DJ role can control music",
  category: "Music",
  access: "admin",
  premium: true,
  memberPermissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  cooldown: 5,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addSubcommand((s) =>
        s.setName("enable").setDescription("Enable DJ mode — restricts music controls to DJ role"),
      )
      .addSubcommand((s) => s.setName("disable").setDescription("Disable DJ mode — anyone can control music"))
      .addSubcommand((s) => s.setName("status").setDescription("View DJ mode status")),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const sub = ctx.isSlash ? ctx.interaction!.options.getSubcommand(true) : (ctx.args[0]?.toLowerCase() ?? "status");
    if (sub === "enable") {
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "music.djMode": true } }, { upsert: true });
      await ctx.reply({ embeds: [successEmbed("🎧 **DJ Mode enabled**. Only members with the DJ role can use music controls.\n\nSet a DJ role with `djrole set @Role`.")] });
    } else if (sub === "disable") {
      await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { "music.djMode": false } });
      await ctx.reply({ embeds: [successEmbed("DJ Mode **disabled**. All members can now control music.")] });
    } else {
      const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
      const enabled = (cfg as any)?.music?.djMode ?? false;
      const djRoleId = (cfg as any)?.djRoleIds?.[0] ?? null;
      await ctx.reply({ embeds: [baseEmbed("primary").setTitle("🎧 DJ Mode").addFields({ name: "Status", value: enabled ? "✅ Enabled" : "❌ Disabled", inline: true }, { name: "DJ Role", value: djRoleId ? `<@&${djRoleId}>` : "Not set", inline: true })] });
    }
  },
};
export default command;
