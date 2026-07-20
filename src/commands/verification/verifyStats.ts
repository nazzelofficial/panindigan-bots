import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "verifystats",
  description: "Show verification statistics for this server",
  category: "Verification",
  access: "admin",
  guildOnly: true,
  cooldown: 10,
  aliases: ["verificationstats"],
  slashData: (_b) => _b,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const verifiedRoleId = (cfg as any)?.verification?.roleId ?? (cfg as any)?.verifiedRoleId;
    if (!verifiedRoleId) { await ctx.reply({ embeds: [errorEmbed("No verified role configured. Use `verifysetup` first.")] }); return; }
    await guild.members.fetch();
    const total = guild.members.cache.filter((m) => !m.user.bot).size;
    const verified = guild.members.cache.filter((m) => !m.user.bot && m.roles.cache.has(verifiedRoleId)).size;
    const unverified = total - verified;
    const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
    const embed = baseEmbed("primary")
      .setTitle("✅ Verification Statistics")
      .addFields(
        { name: "Total Members", value: total.toString(), inline: true },
        { name: "Verified", value: `${verified} (${pct}%)`, inline: true },
        { name: "Unverified", value: unverified.toString(), inline: true },
        { name: "Verified Role", value: `<@&${verifiedRoleId}>`, inline: true },
        { name: "Method", value: (cfg as any)?.verification?.method ?? "button", inline: true },
        { name: "Status", value: (cfg as any)?.verification?.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      );
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
