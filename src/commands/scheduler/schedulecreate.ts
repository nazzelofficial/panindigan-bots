import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "schedulecreate",
  description: "Create a scheduled task",
  category: "Scheduler",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("name").setDescription("Task name").setRequired(true))
      .addStringOption((o) => o.setName("time").setDescription("Time to execute (e.g., 2024-01-01 12:00)").setRequired(true))
      .addStringOption((o) => o.setName("message").setDescription("Message to send").setRequired(true))
      .addChannelOption((o) => o.setName("channel").setDescription("Channel to send to").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const name = ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[0];
    const time = ctx.isSlash ? ctx.interaction!.options.getString("time", true) : ctx.args[1];
    const message = ctx.isSlash ? ctx.interaction!.options.getString("message", true) : ctx.args[2];
    const channel = ctx.isSlash ? ctx.interaction!.options.getChannel("channel", true) : guild.channels.cache.get(ctx.args[3]?.replace(/\D/g, "") ?? "");

    if (!name || !time || !message || !channel) {
      await ctx.reply({ embeds: [errorEmbed("Please provide name, time, message, and channel.")] });
      return;
    }

    if (!(channel as any)?.isTextBased?.()) {
      await ctx.reply({ embeds: [errorEmbed("Channel must be a text channel.")] });
      return;
    }

    const parsedTime = new Date(time);
    if (isNaN(parsedTime.getTime())) {
      await ctx.reply({ embeds: [errorEmbed("Invalid time format. Use YYYY-MM-DD HH:MM.")] });
      return;
    }

    const task = { id: Date.now().toString(), name, time: parsedTime, message, channelId: channel.id, executed: false };
    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $push: { scheduledTasks: task } },
      { upsert: true }
    );
    await ctx.reply({ embeds: [successEmbed(`Scheduled task "${name}" created for ${time} in ${channel}.`)] });
  },
};
export default command;
