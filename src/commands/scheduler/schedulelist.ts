import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "@/structures/types";
import { GuildModel } from "@/database/models/Guild";
import { baseEmbed, infoEmbed } from "@/utils/embeds";

const command: CommandDefinition = {
  name: "schedulelist",
  description: "List all scheduled tasks",
  category: "Scheduler",
  access: "admin",
  guildOnly: true,
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const tasks = (cfg as any)?.scheduledTasks ?? [];

    if (!tasks.length) {
      await ctx.reply({ embeds: [infoEmbed("No scheduled tasks.")] });
      return;
    }

    const embed = baseEmbed("primary")
      .setTitle("📅 Scheduled Tasks")
      .setDescription(tasks.map((t: any) => `**${t.name}** — ${new Date(t.time).toLocaleString()} (${t.executed ? "Executed" : "Pending"}) (ID: ${t.id})`).join("\n"))
      .setFooter({ text: `${tasks.length} task(s) scheduled` });

    await ctx.reply({ embeds: [embed] });
  },
};
export default command;
