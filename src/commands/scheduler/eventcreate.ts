import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "eventcreate",
  description: "Create an event",
  category: "Scheduler",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder)
      .addStringOption((o) => o.setName("name").setDescription("Event name").setRequired(true))
      .addStringOption((o) => o.setName("date").setDescription("Event date (YYYY-MM-DD)").setRequired(true))
      .addStringOption((o) => o.setName("description").setDescription("Event description").setRequired(false)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const name = ctx.isSlash ? ctx.interaction!.options.getString("name", true) : ctx.args[0];
    const date = ctx.isSlash ? ctx.interaction!.options.getString("date", true) : ctx.args[1];
    const description = ctx.isSlash ? ctx.interaction!.options.getString("description") : ctx.args.slice(2).join(" ");

    if (!name || !date) {
      await ctx.reply({ embeds: [errorEmbed("Please provide event name and date.")] });
      return;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      await ctx.reply({ embeds: [errorEmbed("Invalid date format. Use YYYY-MM-DD.")] });
      return;
    }

    const event = { id: Date.now().toString(), name, date: parsedDate, description: description ?? "" };
    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $push: { events: event } },
      { upsert: true }
    );
    await ctx.reply({ embeds: [successEmbed(`Event "${name}" created for ${date}.`)] });
  },
};
export default command;
