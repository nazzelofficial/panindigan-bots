import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "raidmodestatus",
  description: "Check whether raid mode is currently active in this server",
  category: "Moderation",
  access: "moderator",
  guildOnly: true,
  cooldown: 5,
  aliases: ["raidstatus"],
  slashData: (_b) => _b,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const rm = (cfg as any)?.raidMode ?? {};
    const embed = baseEmbed(rm.enabled ? "danger" : "primary")
      .setTitle("🛡️ Raid Mode Status")
      .addFields(
        { name: "Status", value: rm.enabled ? "🚨 **ACTIVE**" : "✅ Inactive", inline: true },
        { name: "Reason", value: rm.reason ?? "N/A", inline: true },
        { name: "Enabled By", value: rm.enabledBy ? `<@${rm.enabledBy}>` : "N/A", inline: true },
        { name: "Enabled At", value: rm.enabledAt ? `<t:${Math.floor(new Date(rm.enabledAt).getTime() / 1000)}:R>` : "N/A", inline: true },
      )
      .setFooter({ text: rm.enabled ? "Use /raidmode off to disable" : "Use /raidmode on to enable" });
    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
