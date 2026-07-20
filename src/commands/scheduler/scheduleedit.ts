import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "scheduleedit",
  description: "Edit a scheduled task",
  category: "Scheduler",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("id").setDescription("Task ID").setRequired(true))
      .addStringOption((o) => o.setName("time").setDescription("New time (YYYY-MM-DD HH:MM)").setRequired(false))
      .addStringOption((o) => o.setName("message").setDescription("New message").setRequired(false)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const id = ctx.isSlash ? ctx.interaction!.options.getString("id", true) : ctx.args[0];
    const time = ctx.isSlash ? ctx.interaction!.options.getString("time") : ctx.args[1];
    const message = ctx.isSlash ? ctx.interaction!.options.getString("message") : ctx.args.slice(2).join(" ");

    if (!id) {
      await ctx.reply({ embeds: [errorEmbed("Please provide a task ID.")] });
      return;
    }

    const cfg = await GuildModel.findOne({ guildId: guild.id }).lean();
    const tasks = (cfg as any)?.scheduledTasks ?? [];
    const index = tasks.findIndex((t: any) => t.id === id);

    if (index === -1) {
      await ctx.reply({ embeds: [errorEmbed("Task not found.")] });
      return;
    }

    if (time) {
      const parsedTime = new Date(time);
      if (isNaN(parsedTime.getTime())) {
        await ctx.reply({ embeds: [errorEmbed("Invalid time format. Use YYYY-MM-DD HH:MM.")] });
        return;
      }
      tasks[index].time = parsedTime;
    }

    if (message !== undefined) {
      tasks[index].message = message;
    }

    await GuildModel.findOneAndUpdate({ guildId: guild.id }, { $set: { scheduledTasks: tasks } });
    await ctx.reply({ embeds: [successEmbed("Scheduled task updated.")] });
  },
};
export default command;
