import { SlashCommandBuilder } from "discord.js";
import type { CommandDefinition } from "../../structures/types.js";
import { GuildModel } from "../../database/models/Guild.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

const command: CommandDefinition = {
  name: "birthdaymessage",
  description: "Set the birthday message",
  category: "Scheduler",
  access: "admin",
  guildOnly: true,
  slashData: (b) =>
    (b as SlashCommandBuilder).addStringOption((o) => o.setName("message").setDescription("Birthday message (use {user} for mention)").setRequired(true)),
  async execute(ctx) {
    const guild = ctx.interaction?.guild ?? ctx.message?.guild;
    if (!guild) return;

    const message = ctx.isSlash ? ctx.interaction!.options.getString("message", true) : ctx.args.join(" ");
    if (!message) {
      await ctx.reply({ embeds: [errorEmbed("Please provide a message.")] });
      return;
    }

    await GuildModel.findOneAndUpdate(
      { guildId: guild.id },
      { $set: { birthdayMessage: message } },
      { upsert: true }
    );
    await ctx.reply({ embeds: [successEmbed("Birthday message set.")] });
  },
};
export default command;
