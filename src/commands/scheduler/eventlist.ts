import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { baseEmbed, infoEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "eventlist",
  description: "List all events",
  category: "Scheduler",
  access: "admin",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const events = (cfg as any)?.events ?? [];

    if (!events.length) {
      await ctx.reply({ embeds: [infoEmbed("No events configured.")] });
      return;
    }

    const embed = baseEmbed("primary")
      .setTitle("📅 Events")
      .setDescription(events.map((e: any) => `**${e.name}** — ${new Date(e.date).toLocaleDateString()} (ID: ${e.id})`).join("\n"))
      .setFooter({ text: `${events.length} event(s) configured` });

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
