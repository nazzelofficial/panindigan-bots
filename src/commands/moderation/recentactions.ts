import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { ModCaseModel } from "../../database/models/Moderation.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";

const TYPE_EMOJI: Record<string, string> = {
  warn: "⚠️", mute: "🔇", unmute: "🔊", timeout: "⏱️", untimeout: "✅",
  kick: "👢", ban: "🔨", tempban: "⏳", softban: "🧹", unban: "✅", note: "📝",
};

const command: CommandDefinition = {
  name: "recentactions",
  description: "View the most recent moderation actions taken in this server",
  category: "Moderation",
  access: "moderator",
  guildOnly: true,
  cooldown: 5,
  aliases: ["recentmods", "modrecent", "latestmods"],
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addIntegerOption((o) => o.setName("limit").setDescription("Number of actions to show (max 20)").setRequired(false).setMinValue(1).setMaxValue(20))
      .addStringOption((o) =>
        o.setName("type").setDescription("Filter by action type").setRequired(false)
          .addChoices(
            { name: "All", value: "all" },
            { name: "Ban", value: "ban" },
            { name: "Kick", value: "kick" },
            { name: "Mute/Timeout", value: "mute" },
            { name: "Warn", value: "warn" },
            { name: "Unban", value: "unban" },
          ),
      ),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;
    const limit = ctx.isSlash ? (ctx.interaction!.options.getInteger("limit") ?? 10) : 10;
    const typeFilter = ctx.isSlash ? (ctx.interaction!.options.getString("type") ?? "all") : "all";

    const query: any = { guildId: guild.id };
    if (typeFilter !== "all") {
      if (typeFilter === "mute") query.type = { $in: ["mute", "timeout"] };
      else query.type = typeFilter;
    }

    const cases = await ModCaseModel.find(query).lean().sort({ createdAt: -1 }).limit(limit);
    if (!cases.length) { await ctx.reply({ embeds: [infoEmbed("No moderation actions found.")] }); return; }

    const embed = baseEmbed("warning")
      .setTitle("🔨 Recent Moderation Actions")
      .setDescription(
        cases.map((c) => {
          const emoji = TYPE_EMOJI[c.type] ?? "🔨";
          const ts = Math.floor(new Date((c as any).createdAt).getTime() / 1000);
          return `${emoji} **${c.type.toUpperCase()}** [#${c.caseId}] <@${c.userId}> · by <@${c.moderatorId}> <t:${ts}:R>\n↳ ${c.reason.slice(0, 100)}`;
        }).join("\n\n").slice(0, 4000),
      )
      .setFooter({ text: `Showing last ${cases.length} action${cases.length !== 1 ? "s" : ""}` });

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
